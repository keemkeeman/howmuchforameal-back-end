## 한끼얼마
- 식비를 기록하면 내 한끼당 식사 비용을 계산해주는 웹앱입니다.
- 해당 프로젝트는 MERN (MongoDB, Express, Reactjs, Nodejs) 스택을 활용해서 만들었습니다.
- 프론트엔드는 [여기](https://github.com/keemkeeman/howmuchforameal-front-end)를 참고해주세요.

## Link
https://howmuchforameal.vercel.app/

## Libraries
- express v4.18,
- bcrypt,
- mongoose 7.4


## Deploy
서버 배포
- Heroku

## Architecture
![Frame 1](https://github.com/keemkeeman/manstagram/assets/82154123/d99b2b57-6654-4db2-bdba-90ec4ef03afb)
- vercel, heroku로 배포(CI, CD)
- 프론트는 reactjs, tailwindcss로 화면구성, recoil로 전역상태관리
- 백엔드는 nodejs, express, mongoose로 restAPI 활용하여 서버 구축
- 회원 정보 및 식비 데이터는 mongoDB에 저장
