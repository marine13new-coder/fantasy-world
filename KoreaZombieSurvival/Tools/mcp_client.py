"""Local Unity MCP client. Examples: python mcp_client.py list; python mcp_client.py TOOL '{...}'."""
import asyncio
import json
import sys
from fastmcp import Client


async def main():
    async with Client("http://127.0.0.1:8080/mcp") as client:
        if len(sys.argv) < 2 or sys.argv[1] == "list":
            for tool in await client.list_tools():
                print(json.dumps({"name": tool.name, "schema": tool.inputSchema}, ensure_ascii=False))
        elif sys.argv[1] == "resources":
            for resource in await client.list_resources():
                print(resource.model_dump_json())
        elif sys.argv[1] == "read":
            for item in await client.read_resource(sys.argv[2]):
                print(item.model_dump_json())
        else:
            args = json.loads(sys.argv[2]) if len(sys.argv)>2 else {}
            result = await client.call_tool(sys.argv[1], args)
            for item in result.content:
                if getattr(item, "type", "") == "text":
                    print(item.text)
                else:
                    print(json.dumps({"type": item.type, "omitted_binary": True}))


if __name__ == "__main__":
    asyncio.run(main())
