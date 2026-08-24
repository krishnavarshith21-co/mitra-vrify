import json
import os
import redis
import numpy as np
from typing import Dict, Any, Optional

REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")

class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, set):
            return {"__type__": "set", "data": list(obj)}
        if isinstance(obj, np.ndarray):
            return {"__type__": "ndarray", "data": obj.tolist()}
        return super().default(obj)

def custom_json_decoder(dct):
    if "__type__" in dct:
        if dct["__type__"] == "set":
            return set(dct["data"])
        if dct["__type__"] == "ndarray":
            return np.array(dct["data"])
    return dct

class SessionManager:
    def __init__(self):
        self.redis_client = None
        self.fallback_cache = {}
        
        try:
            self.redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
            self.redis_client.ping()
            print(f"Connected to Redis at {REDIS_URL}")
        except (redis.ConnectionError, redis.exceptions.ConnectionError):
            print(f"WARNING: Could not connect to Redis at {REDIS_URL}. Using in-memory dictionary fallback.")
            self.redis_client = None

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        if not session_id:
            return None
            
        if self.redis_client:
            try:
                data = self.redis_client.get(f"session:{session_id}")
                if data:
                    return json.loads(data, object_hook=custom_json_decoder)
            except Exception as e:
                print(f"Redis get error: {e}")
            return None
        else:
            return self.fallback_cache.get(session_id)

    def save_session(self, session_id: str, data: Dict[str, Any], ttl_seconds: int = 3600) -> None:
        if not session_id:
            return
            
        if self.redis_client:
            try:
                serialized_data = json.dumps(data, cls=CustomJSONEncoder)
                self.redis_client.setex(f"session:{session_id}", ttl_seconds, serialized_data)
            except Exception as e:
                print(f"Redis save error: {e}")
        else:
            self.fallback_cache[session_id] = data

    def delete_session(self, session_id: str) -> None:
        if not session_id:
            return
            
        if self.redis_client:
            try:
                self.redis_client.delete(f"session:{session_id}")
            except Exception as e:
                print(f"Redis delete error: {e}")
        else:
            self.fallback_cache.pop(session_id, None)
            
    def get_all_session_keys(self) -> list[str]:
        if self.redis_client:
            try:
                keys = self.redis_client.keys("session:*")
                return [str(k).replace("session:", "") for k in keys]
            except Exception as e:
                print(f"Redis keys error: {e}")
                return []
        else:
            return list(self.fallback_cache.keys())

class SessionProxy(dict):
    def __init__(self, manager: SessionManager, session_id: str, data: dict):
        super().__init__(data)
        self.manager = manager
        self.session_id = session_id
        
    def __setitem__(self, key, value):
        super().__setitem__(key, value)
        self.manager.save_session(self.session_id, dict(self))

    def update(self, *args, **kwargs):
        super().update(*args, **kwargs)
        self.manager.save_session(self.session_id, dict(self))

    def pop(self, key, default=None):
        res = super().pop(key, default)
        self.manager.save_session(self.session_id, dict(self))
        return res

class SessionCacheDict:
    def __init__(self, manager: SessionManager):
        self.manager = manager
        
    def __getitem__(self, key: str):
        val = self.manager.get_session(key)
        if val is None:
            raise KeyError(key)
        return SessionProxy(self.manager, key, val)
        
    def __setitem__(self, key: str, value: dict):
        self.manager.save_session(key, value)
        
    def __contains__(self, key: str):
        return self.manager.get_session(key) is not None
        
    def get(self, key: str, default=None):
        val = self.manager.get_session(key)
        if val is not None:
            return SessionProxy(self.manager, key, val)
        return default
        
    def pop(self, key: str, default=None):
        val = self.manager.get_session(key)
        self.manager.delete_session(key)
        return val if val is not None else default
        
    def items(self):
        for k in self.manager.get_all_session_keys():
            val = self.manager.get_session(k)
            if val is not None:
                yield k, SessionProxy(self.manager, k, val)
                
    def keys(self):
        return self.manager.get_all_session_keys()

SESSION_CACHE = SessionCacheDict(SessionManager())
