# Stage 1: Node.js scraper with Puppeteer and Chromium
FROM node:18-slim AS scraper

RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY ./scraper/package.json ./
RUN npm install

COPY ./scraper/scrape.js ./

RUN echo '{"placeholder": "This will be replaced when the container runs"}' > /app/scraped_data.json

ENV SCRAPE_URL=https://exactspace.co/


# Stage 2: Python Flask server
FROM python:3.10-slim AS server

WORKDIR /app

COPY ./server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./server/server.py .

COPY --from=scraper /app/scraped_data.json .

RUN echo '#!/bin/bash\n\
echo "Starting web scraper..."\n\
echo "Scraping URL: $SCRAPE_URL"\n\
echo "Waiting for data to be scraped..."\n\
echo "Starting Flask server..."\n\
python server.py' > /app/start.sh && chmod +x /app/start.sh

EXPOSE 5000


FROM python:3.10-slim AS final

RUN apt-get update && apt-get install -y \
    nodejs npm \
    chromium \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

COPY ./server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY ./scraper/package.json .
RUN npm install

COPY ./scraper/scrape.js .
COPY ./server/server.py .

RUN echo '#!/bin/bash\n\
echo "Starting web scraper..."\n\
echo "Scraping URL: $SCRAPE_URL"\n\
node /app/scrape.js\n\
echo "Starting Flask server..."\n\
python /app/server.py' > /app/start.sh && chmod +x /app/start.sh

ENV SCRAPE_URL=https://exactspace.co/

EXPOSE 5000

CMD ["/app/start.sh"]
