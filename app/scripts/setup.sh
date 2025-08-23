#!/bin/bash

# Football Betting DApp 前端设置脚本

echo "🚀 开始设置 Football Betting DApp 前端..."

# 检查 Node.js 版本
echo "📦 检查 Node.js 版本..."
node_version=$(node -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ Node.js 版本: $node_version"
else
    echo "❌ 未找到 Node.js，请先安装 Node.js 18+"
    exit 1
fi

# 检查 npm 版本
echo "📦 检查 npm 版本..."
npm_version=$(npm -v 2>/dev/null)
if [ $? -eq 0 ]; then
    echo "✅ npm 版本: $npm_version"
else
    echo "❌ 未找到 npm"
    exit 1
fi

# 安装依赖
echo "📦 安装项目依赖..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ 依赖安装成功"
else
    echo "❌ 依赖安装失败"
    exit 1
fi

# 复制环境变量示例文件
if [ ! -f ".env" ]; then
    echo "📝 创建环境变量文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件，请编辑该文件配置实际的合约地址和项目ID"
else
    echo "ℹ️  .env 文件已存在，跳过创建"
fi

echo ""
echo "🎉 前端设置完成！"
echo ""
echo "📋 后续步骤："
echo "1. 编辑 .env 文件，填入正确的合约地址和 WalletConnect 项目ID"
echo "2. 运行 'npm run dev' 启动开发服务器"
echo "3. 访问 http://localhost:5173 查看应用"
echo ""
echo "📖 更多信息请查看 README.md"