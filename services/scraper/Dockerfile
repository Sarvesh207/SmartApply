FROM python:3.12-slim
WORKDIR /app

# Install system dependencies for postgres connector
RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy scraper code
COPY . .

# Run the scraper
CMD ["python", "scraper.py"]
