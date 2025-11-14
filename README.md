# AI 你画我猜网页游戏

一个基于AI的在线你画我猜游戏，玩家可以绘制图片，AI会识别并猜测绘制的物品。

## 技术栈
- 前端：React + TypeScript + Vite
- 后端：Node.js + Express
- 画布：HTML5 Canvas
- AI：OpenAI Vision API

## 项目结构
```
├── frontend/     # 前端React应用
├── backend/      # 后端Node.js服务器
├── shared/       # 共享类型定义
├── public/       # 静态资源
└── task.md       # 项目任务清单
```

## 快速开始

### 环境要求
- Node.js >= 18
- npm 或 yarn

### 安装依赖
```bash
# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install
```

### 运行项目
```bash
# 启动后端服务器
cd backend
npm run dev

# 启动前端开发服务器（新终端）
cd frontend
npm run dev
```

## 开发计划
详见 [task.md](./task.md) 文件

## 许可证
MIT