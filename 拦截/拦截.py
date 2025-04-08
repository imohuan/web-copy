from typing import Union
from fastapi import FastAPI, Request, Response, Header, Body, Form, Query, Path, Depends
from fastapi.responses import StreamingResponse
from fastapi.responses import JSONResponse
import json
from starlette.middleware.cors import CORSMiddleware
import http.client
import json

from openai import OpenAI
import os

__dirname = os.path.dirname(__file__)

import uvicorn

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 允许所有来源,您可以根据需要限制
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有方法
    allow_headers=["*"],  # 允许所有头部
)


@app.get("/")
def read_root():
    return {"Hello": "World"}


def chat(data_json):
    conn = http.client.HTTPSConnection("yunwu.ai")
    payload = json.dumps(data_json)
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer sk-V2kiXN9FcwMUxsBAB0qwM6x7LpjBl2aIk7hcc86J9Vsqm5lJ",
        "Content-Type": "application/json",
    }
    conn.request("POST", "/v1/chat/completions", payload, headers)
    res = conn.getresponse()
    data = res.read()
    return data.decode("utf-8")


async def stream_chat(data_json):
    conn = http.client.HTTPSConnection("yunwu.ai")
    payload = json.dumps(data_json)
    headers = {
        "Accept": "application/json",
        "Authorization": "Bearer sk-V2kiXN9FcwMUxsBAB0qwM6x7LpjBl2aIk7hcc86J9Vsqm5lJ",
        "Content-Type": "application/json",
    }

    # 确保请求中设置了stream=true
    if "stream" not in data_json or not data_json["stream"]:
        data_json["stream"] = True

    # 将JSON数据写入文件
    with open("request_data.json", "w", encoding="utf-8") as f:
        json.dump(data_json, f, ensure_ascii=False, indent=2)

    conn.request("POST", "/v1/chat/completions", payload, headers)
    response = conn.getresponse()

    # 打开文件用于写入响应chunk
    with open("response_chunks.txt", "wb") as f:
        while True:
            chunk = response.read(4096)
            if not chunk:
                break
            f.write(chunk)  # 将chunk写入文件
            yield chunk  # 同时也yield chunk以保持原有功能


async def moni_stream_chat(data_json):
    # 打开文件用于写入响应chunk
    with open(
        os.path.join(__dirname, "response_chunks.txt"), "r", encoding="utf-8"
    ) as f:
        for line in f.readlines():
            if not line:
                break
            yield line  # 同时也yield chunk以保持原有功能


@app.route("/v1/chat/completions", methods=["POST", "OPTIONS"])
async def completions(request: Request):
    if request.method == "OPTIONS":
        return Response(status_code=200)
    json_data = await request.json()
    return StreamingResponse(
        moni_stream_chat(json_data), media_type="text/event-stream"
    )


if __name__ == "__main__":
    uvicorn.run("拦截:app", host="0.0.0.0", port=8000, reload=True)
