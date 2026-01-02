# Używamy lekkiej wersji Pythona
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Kopiujemy kod PRZED seed_data.py, aby mogły być dostępne moduły
COPY . .

# Tworzymy katalog /data dla bazy danych
RUN mkdir -p /data

EXPOSE 5001

CMD ["python3", "app.py"]