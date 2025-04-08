import os
import json

__dirname = os.path.dirname(__file__)
with open(os.path.join(__dirname, "response_chunks.txt"), "r", encoding="utf-8") as f:
    content = ""
    for line in f.readlines():
        if "[DONE]" in line:
            break

        if "data:" in line:
            choices = json.loads(line[5:])["choices"]
            print(choices)
            content += choices[0]["delta"].get("content", "")

    with open(os.path.join(__dirname, "response.txt"), "w", encoding="utf-8") as f:
        f.write(content)
