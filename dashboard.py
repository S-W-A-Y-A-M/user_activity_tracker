# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from pymongo import MongoClient, ASCENDING, DESCENDING
import json
import time
import threading
from datetime import datetime, timezone, timedelta
from bson.objectid import ObjectId


app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="http://localhost:5173")
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# --- Database Configuration ---
MONGO_URL = "mongodb://user:password@db_url/?authSource="
MONGO_DB = ""
MONGO_COLLECTION = ""


client = MongoClient(MONGO_URL)
db = client[MONGO_DB]
logs_collection = db[MONGO_COLLECTION]
users_collection = db[""]


def ensure_indexes():
    try:
        logs_collection.create_index([("timestamp", DESCENDING)])
        logs_collection.create_index([("user_id", ASCENDING), ("timestamp", DESCENDING)])
        logs_collection.create_index([("org_id", ASCENDING), ("timestamp", DESCENDING)])
        print("Indexes ensured successfully.")
    except Exception as e:
        print(f"Skipping index creation: {e}")

ensure_indexes()

# --- Helper Function ---
def filter_log(doc):
    is_login = (
        doc.get("path") == ""
        and doc.get("method") == "POST"
    )
    api_status = doc.get("api_status", {}) or {}
    return {
        "_id": str(doc.get("_id")),
        "timestamp": doc.get("timestamp").isoformat() if isinstance(doc.get("timestamp"), datetime) else str(doc.get("timestamp", "")),
        "path": str(doc.get("path", "")),
        "method": str(doc.get("method", "")),
        "ip": str(doc.get("ip", "")),
        "blueprint": str(doc.get("blueprint", "")),
        "org_id": str(doc.get("org_id", "")),
        "user_id": str(doc.get("user_id", "")),
        "is_login_event": is_login,
        "message": str(api_status.get("message", "")),
        "code": str(api_status.get("code", "")),
    }

# --- Background Polling Task ---
def watch_logs():
    last_id = None
    try:
        latest_docs = list(logs_collection.find().sort("_id", -1).limit(1))
        if latest_docs:
            last_id = latest_docs[0]['_id']
    except Exception:
        last_id = None

    print(f"Starting log watcher. Last known ID: {last_id}")
    while True:
        try:
            query = {"_id": {"$gt": last_id}} if last_id else {}
            new_logs = list(logs_collection.find(query).sort("_id", 1))
            if new_logs:
                for doc in new_logs:
                    last_id = doc["_id"]
                    data = json.dumps(filter_log(doc))
                    user_id = doc.get("user_id")
                    if user_id:
                        socketio.emit("log", data, room=str(user_id), namespace="/logs")
                    socketio.emit("log", data, room="latest", namespace="/logs")
            time.sleep(1)
        except Exception as e:
            print(f"Error in polling thread: {e}")
            time.sleep(5)

# --- Socket.IO Event Handlers ---
@socketio.on("connect", namespace="/logs")
def handle_connect():
    print(f"Client connected: {request.sid}")

@socketio.on("disconnect", namespace="/logs")
def handle_disconnect():
    print(f"Client disconnected: {request.sid}")

@socketio.on("subscribe", namespace="/logs")
def on_subscribe(data):
    sid = request.sid
    sub_type = (data or {}).get("type")
    print(f"Received subscription request from {sid}: {data}")
    if sub_type == "latest":
        join_room("latest")
        print(f"Client {sid} joined room 'latest'")
        try:
            recent_logs = list(logs_collection.find().sort("timestamp", DESCENDING).limit(10))
            for doc in reversed(recent_logs):
                emit("log", json.dumps(filter_log(doc)), room=sid)
            print(f"Sent {len(recent_logs)} historical logs to {sid} in 'latest' room")
        except Exception as e:
            print(f"Database error fetching recent logs for 'latest': {e}")

# --- API Endpoints ---
@app.route("/logs", methods=["GET"])
def get_logs():
    try:
        filter_conditions = []
        user_id_str = request.args.get("user_id")
        if user_id_str:
            try:
                user_condition = {"$or": [{"user_id": user_id_str}, {"user_id": ObjectId(user_id_str)}]}
                filter_conditions.append(user_condition)
            except Exception:
                filter_conditions.append({"user_id": user_id_str})
        
        start_date_str = request.args.get("start_date")
        end_date_str = request.args.get("end_date")
        
        def parse_utc_iso_string(s):
            if not s: return None
            try:
                if s.endswith("Z"): s = s[:-1] + "+00:00"
                dt = datetime.fromisoformat(s)
                return dt.astimezone(timezone.utc)
            except ValueError: return None

        start_date = parse_utc_iso_string(start_date_str)
        end_date = parse_utc_iso_string(end_date_str)
        
        time_condition = {}
        if start_date: time_condition["$gte"] = start_date
        if end_date:
            end_date_inclusive = end_date.replace(hour=23, minute=59, second=59, microsecond=999999)
            time_condition["$lte"] = end_date_inclusive
        if time_condition: filter_conditions.append({"timestamp": time_condition})
            
        query = {"$and": filter_conditions} if filter_conditions else {}
        
        limit = int(request.args.get("limit", 50))
        sort_dir = DESCENDING if request.args.get("order", "desc").lower() != "asc" else ASCENDING
        logs = list(logs_collection.find(query).sort("timestamp", sort_dir).limit(limit))
        return jsonify([filter_log(doc) for doc in logs]), 200
    except Exception as e:
        print(f"Error in /logs endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route("/report/dashboard_stats", methods=["GET"])
def get_dashboard_stats():
    try:
        now_utc = datetime.now(timezone.utc)
        start_of_day = now_utc.replace(hour=0, minute=0, second=0, microsecond=0)
        
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_of_day}}},
            {"$facet": {
                "kpi_stats": [
                    {"$group": {
                        "_id": None,
                        "total_calls": {"$sum": 1},
                        "unique_users": {"$addToSet": "$user_id"},
                        "total_logins": {"$sum": {"$cond": [{"$eq": ["$path", "/auth/v1/POSTuserauth"]}, 1, 0]}},
                        # NOTE: Comparing status code as a string works for standard HTTP codes but is brittle.
                        # Storing codes as integers would be more robust.
                        "total_errors": {"$sum": {"$cond": [{"$gte": ["$api_status.code", "400"]}, 1, 0]}}
                    }},
                    {"$project": {
                        "_id": 0, "total_calls": 1, "unique_users_count": {"$size": "$unique_users"},
                        "total_logins": 1, "total_errors": 1
                    }}
                ],
                "top_endpoints": [
                    {"$group": {"_id": "$path", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}, {"$limit": 5}
                ],
                "error_breakdown": [
                    {"$match": {"api_status.code": {"$gte": "400"}}},
                    {"$group": {"_id": "$api_status.code", "count": {"$sum": 1}}},
                    {"$sort": {"count": -1}}
                ]
            }}
        ]
        
        last_24_hours = now_utc - timedelta(hours=24)
        activity_pipeline = [
            {"$match": {"timestamp": {"$gte": last_24_hours}}},
            {"$group": {"_id": {"$hour": "$timestamp"}, "count": {"$sum": 1}}},
            {"$sort": {"_id": 1}}
        ]
        
        main_result = list(logs_collection.aggregate(pipeline))
        activity_result = list(logs_collection.aggregate(activity_pipeline))
        
        data = main_result[0] if main_result and main_result[0] else {}
        
        kpis = (data.get("kpi_stats", [{}]))[0]
        total_calls = kpis.get("total_calls", 0)
        error_rate = (kpis.get("total_errors", 0) / total_calls * 100) if total_calls > 0 else 0
        
        hourly_counts = {item['_id']: item['count'] for item in activity_result}
        activity_data = [hourly_counts.get(h, 0) for h in range(24)]
        
        report = {
            "kpis": {
                "unique_users_today": kpis.get("unique_users_count", 0),
                "total_api_calls": total_calls,
                "error_rate": round(error_rate, 2),
                "total_logins": kpis.get("total_logins", 0)
            },
            "charts": {
                "activity_over_time": {"labels": [f"{h}:00" for h in range(24)], "values": activity_data},
                "top_endpoints": {"labels": [item['_id'] for item in data.get("top_endpoints", [])], "values": [item['count'] for item in data.get("top_endpoints", [])]},
                "error_breakdown": {"labels": [item['_id'] for item in data.get("error_breakdown", [])], "values": [item['count'] for item in data.get("error_breakdown", [])]}
            }
        }
        return jsonify(report), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route("/users", methods=["GET"])
def get_users_for_org():
    try:
        org_id_str = "66dbfff065ee59ec86ffbc39"
        org_id_obj = ObjectId(org_id_str)
        query = {
            "$or": [{"org_id": org_id_obj}, {"org_id": org_id_str}],
            "is_disabled": {"$ne": "Y"}
        }
        projection = {"_id": 1, "username": 1, "first_name": 1, "last_name": 1, "email": 1}
        users_cursor = users_collection.find(query, projection)
        user_list = []
        for user in users_cursor:
            full_name = f"{user.get('first_name', '')} {user.get('last_name', '')}".strip()
            display_name = user.get('username') or full_name or user.get('email', str(user["_id"]))
            user_list.append({"id": str(user["_id"]), "name": display_name})
        return jsonify(user_list), 200
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# --- Main Execution ---
if __name__ == "__main__":
    socketio.start_background_task(watch_logs)
    socketio.run(app, host="0.0.0.0", port=5000, debug=True)