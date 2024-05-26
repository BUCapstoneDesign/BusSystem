FROM node:18-alpine

# 앱 디렉토리 생성
WORKDIR /app

# 앱의 package.json과 package-lock.json 파일 복사
COPY package*.json ./

# 앱의 종속성 설치
RUN npm install

# 앱 소스 코드 복사
COPY . .

# 환경 변수 로드
COPY .env .env

# 애플리케이션 포트
EXPOSE 8080

# 앱 실행
CMD ["node", "server.js"]