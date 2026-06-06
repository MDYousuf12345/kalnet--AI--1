from agents.base import get_llm

response = get_llm().invoke("Explain AI in one line")

print(response.content)
