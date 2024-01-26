# 기본 이미지 선택
FROM node:18

# 작업 디렉토리 설정
WORKDIR /usr/src/app

# 애플리케이션 파일 복사
COPY package*.json ./

# 필요한 npm 패키지 설치
RUN npm install

# 나머지 애플리케이션 소스 복사
COPY . .

# 애플리케이션 실행을 위한 포트 지정
EXPOSE 8000

# 애플리케이션 실행
CMD ["node", "main.js"]
