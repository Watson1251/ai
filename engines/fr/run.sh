# uvicorn main:app --reload
# uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo "Running gunicorn"
gunicorn -b fr-engine:8000 main:app --reload