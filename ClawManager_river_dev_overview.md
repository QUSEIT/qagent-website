# ClawManager_river_dev 项目文档

## 项目概述

ClawManager 是一个 Kubernetes 原生的控制平面，用于管理 OpenClaw 和 Linux 桌面运行时。

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 19 + TypeScript + Vite + TailwindCSS |
| 后端 | Go 1.26+ + Gin framework |
| 数据库 | MySQL (upper/db v4) |
| 编排 | Kubernetes (Pod/PVC/Service/Secret) |
| 开发端口 | 前端 9002，后端 9001 |

## 架构

```
Browser
  -> React Frontend (port 9002)
  -> Go Backend API (port 9001)
  -> MySQL (状态持久化)
  -> Kubernetes API (资源编排)
  -> Instance Pods (OpenClaw/Webtop/Linux desktops)
```

## 项目结构

```
ClawManager_river_dev/
├── backend/
│   ├── cmd/
│   │   ├── server/main.go          # 应用入口，依赖注入，路由注册
│   │   ├── initdb/                  # 数据库初始化
│   │   └── fixpassword/            # 密码修复工具
│   └── internal/
│       ├── aigateway/              # AI Gateway 服务 (LLM代理/审计/成本/风险)
│       ├── config/                 # 配置加载
│       ├── db/                     # 数据库初始化与迁移
│       ├── handlers/              # HTTP handlers (Gin controllers)
│       ├── middleware/            # Auth/CORS/Error/RBAC
│       ├── models/                # 数据结构
│       ├── repository/            # 数据访问层 (upper/db)
│       ├── services/              # 业务逻辑
│       │   ├── k8s/               # K8s client (Pod/PVC/Service/Secret)
│       │   └── ...
│       └── utils/                 # JWT/密码/响应
├── frontend/
│   └── src/
│       ├── components/            # React 组件
│       ├── contexts/              # Auth/I18n 上下文
│       ├── hooks/                  # 自定义 hooks
│       ├── lib/                    # 工具库 (i18n/templates)
│       ├── pages/                  # 页面 (admin/auth/dashboard/instances)
│       ├── router/                 # 路由定义
│       ├── services/               # API 客户端 (axios)
│       ├── stores/                 # Zustand 状态管理
│       └── types/                  # TypeScript 类型
├── deployments/                    # K8s 部署配置
├── build-script/                   # 构建脚本
├── Dockerfile
└── README*.md
```

## API 路由

### 认证 (无认证)
```
POST /api/v1/auth/register      # 注册
POST /api/v1/auth/login         # 登录
POST /api/v1/auth/refresh       # 刷新token
POST /api/v1/auth/logout        # 登出
GET  /api/v1/auth/me            # 当前用户 (需认证)
POST /api/v1/auth/change-password
```

### 用户管理 (需认证)
```
GET    /api/v1/users            # 列表 (管理员)
POST   /api/v1/users            # 创建 (管理员)
POST   /api/v1/users/import     # 批量导入 (管理员)
DELETE /api/v1/users/:id        # 删除 (管理员)
PUT    /api/v1/users/:id/role   # 更新角色 (管理员)
PUT    /api/v1/users/:id/quota  # 更新配额 (管理员)
GET    /api/v1/users/:id        # 获取用户
PUT    /api/v1/users/:id        # 更新用户
GET    /api/v1/users/:id/quota  # 获取配额
```

### 实例管理 (需认证)
```
GET    /api/v1/instances                    # 列出当前用户实例
POST   /api/v1/instances                    # 创建实例
GET    /api/v1/instances/:id                # 获取实例详情
PUT    /api/v1/instances/:id                # 更新实例
DELETE /api/v1/instances/:id                # 删除实例
POST   /api/v1/instances/:id/start          # 启动
POST   /api/v1/instances/:id/stop           # 停止
POST   /api/v1/instances/:id/restart        # 重启
GET    /api/v1/instances/:id/status         # 获取状态
GET    /api/v1/instances/:id/runtime        # 运行时详情
POST   /api/v1/instances/:id/runtime/:cmd   # 创建运行时命令
GET    /api/v1/instances/:id/config/revisions
POST   /api/v1/instances/:id/config/revisions/publish
POST   /api/v1/instances/:id/access         # 生成访问token
GET    /api/v1/instances/:id/access         # 访问实例
POST   /api/v1/instances/:id/sync           # 强制同步
GET    /api/v1/instances/:id/openclaw/export
POST   /api/v1/instances/:id/openclaw/import
GET    /api/v1/instances/:id/skills
POST   /api/v1/instances/:id/skills
DELETE /api/v1/instances/:id/skills/:skillId
```

### 管理员实例 (需管理员权限)
```
GET /api/v1/admin/instances   # 跨用户实例列表
```

### OpenClaw 配置
```
GET    /api/v1/openclaw-configs/resources
POST   /api/v1/openclaw-configs/resources
POST   /api/v1/openclaw-configs/resources/validate
GET    /api/v1/openclaw-configs/resources/:id
PUT    /api/v1/openclaw-configs/resources/:id
DELETE /api/v1/openclaw-configs/resources/:id
POST   /api/v1/openclaw-configs/resources/:id/clone

GET    /api/v1/openclaw-configs/bundles
POST   /api/v1/openclaw-configs/bundles
GET    /api/v1/openclaw-configs/bundles/:id
PUT    /api/v1/openclaw-configs/bundles/:id
DELETE /api/v1/openclaw-configs/bundles/:id
POST   /api/v1/openclaw-configs/bundles/:id/clone

POST   /api/v1/openclaw-configs/compile-preview
GET    /api/v1/openclaw-configs/injections
GET    /api/v1/openclaw-configs/injections/:id
```

### 技能管理 (需认证)
```
GET    /api/v1/skills                 # 技能列表
POST   /api/v1/skills/import          # 导入技能
GET    /api/v1/skills/:id             # 获取技能
PUT    /api/v1/skills/:id             # 更新技能
DELETE /api/v1/skills/:id             # 删除技能
GET    /api/v1/skills/:id/download    # 下载技能
GET    /api/v1/skills/:id/versions    # 版本列表
GET    /api/v1/skills/:id/scan-results
```

### 系统设置
```
GET  /api/v1/system-settings/images
PUT  /api/v1/system-settings/images         # (管理员)
DELETE /api/v1/system-settings/images/:type # (管理员)
GET  /api/v1/system-settings/cluster-resources
```

### AI Gateway (实例token认证)
```
GET  /api/v1/gateway/llm/models
POST /api/v1/gateway/llm/chat/completions
```

### 管理员 AI 审计 (需管理员权限)
```
GET /api/v1/admin/ai-audit           # 审计列表
GET /api/v1/admin/ai-audit/:traceId  # 追踪详情
GET /api/v1/admin/costs              # 成本概览
```

### 风险规则 (需管理员权限)
```
GET    /api/v1/admin/risk-rules
POST   /api/v1/admin/risk-rules/test
POST   /api/v1/admin/risk-rules/bulk-status
PUT    /api/v1/admin/risk-rules
DELETE /api/v1/admin/risk-rules/:ruleId
```

### 管理员技能 (需管理员权限)
```
GET /api/v1/admin/skills
```

### 安全 (需管理员权限)
```
GET  /api/v1/admin/security/config
PUT  /api/v1/admin/security/config
POST /api/v1/admin/security/scan-jobs
POST /api/v1/admin/security/skills/:id/rescan
GET  /api/v1/admin/security/scan-jobs
GET  /api/v1/admin/security/scan-jobs/:id
```

### Agent 控制面
```
POST /api/v1/agent/register
POST /api/v1/agent/heartbeat
GET  /api/v1/agent/commands/next
POST /api/v1/agent/commands/:id/start
POST /api/v1/agent/commands/:id/finish
POST /api/v1/agent/state/report
POST /api/v1/agent/skills/inventory
POST /api/v1/agent/skills/upload
GET  /api/v1/agent/skills/versions/:id/download
GET  /api/v1/agent/config/revisions/:id
```

### 实例代理 (token认证)
```
ANY /api/v1/instances/:id/proxy
ANY /api/v1/instances/:id/proxy/*
```

### WebSocket (需认证)
```
GET  /api/v1/ws
GET  /api/v1/ws/stats
```

## Instance 创建接口

**端点:** `POST /api/v1/instances`

### 请求参数

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 实例名称，3~50字符 |
| `type` | string | ✅ | 类型：`openclaw`/`ubuntu`/`debian`/`centos`/`custom`/`webtop`/`hermesagent` |
| `cpu_cores` | float64 | ✅ | CPU核数，0.1~32 |
| `memory_gb` | int | ✅ | 内存 GB，1~128 |
| `disk_gb` | int | ✅ | 磁盘 GB，10~1000 |
| `os_type` | string | ✅ | 操作系统类型 |
| `os_version` | string | ✅ | 操作系统版本 |
| `description` | string | ❌ | 描述 |
| `gpu_enabled` | bool | ❌ | 是否启用 GPU |
| `gpu_count` | int | ❌ | GPU 数量，0~4 |
| `image_registry` | string | ❌ | 镜像仓库 |
| `image_tag` | string | ❌ | 镜像标签 |
| `environment_overrides` | map[string]string | ❌ | 环境变量覆盖 |
| `storage_class` | string | ❌ | 存储类 |
| `openclaw_config_plan` | object | ❌ | OpenClaw 配置计划 |
| `skill_ids` | number[] | ❌ | 关联的技能 ID 列表 |

### 实例类型

| ID | 名称 | 默认 OS | 默认版本 |
|----|------|--------|---------|
| `openclaw` | OpenClaw Desktop | openclaw | latest |
| `hermesagent` | HermesAgent Desktop | ubuntu | 22.04 |
| `ubuntu` | Ubuntu Desktop | ubuntu | 22.04 |
| `debian` | Debian Desktop | debian | 12 |
| `centos` | CentOS Desktop | centos | 9 |
| `webtop` | Webtop Desktop | ubuntu | xfce |
| `custom` | Custom Image | custom | latest |

### 预设配置

| 配置 | CPU | 内存 | 磁盘 |
|------|-----|------|------|
| Small | 2 | 4 GB | 20 GB |
| Medium | 4 | 8 GB | 50 GB |
| Large | 8 | 16 GB | 100 GB |

## K8s 集成模式

通过 `K8S_MODE` 环境变量配置：
- `incluster`: 运行在 K8s Pod 内 (使用 ServiceAccount)
- `outofcluster`: 外部集群 (使用 kubeconfig)
- `auto`: 优先 incluster，回退到 outofcluster

管理的 K8s 资源：
- **Pod**: 桌面运行时容器
- **PVC**: 每个实例的持久化存储
- **Service**: 内部网络
- **Secret**: OpenClaw 配置注入

## AI Gateway

提供 OpenAI 兼容的 LLM 代理，支持：
- 多 provider (OpenAI/Anthropic/DeepSeek 等)
- 端到端审计日志
- Token 成本计算
- 风险规则检测 (block/require_approval/route_secure_model)
- 自动路由到安全模型处理敏感内容

## 默认凭据

- 管理员: `admin / admin123`
- 导入的管理员: `admin123`
- 导入的普通用户: `user123`

## 开发命令

### 前端
```bash
cd frontend
npm install
npm run dev      # 开发服务器 (port 9002)
npm run build    # 生产构建
npm run lint     # 代码检查
```

### 后端
```bash
cd backend
make build       # 编译
make run         # 运行 (需 MySQL)
make test        # 测试
make docker-up   # 启动 MySQL (Docker)
make migrate     # 运行迁移
```

### 完整应用
```bash
docker build -t clawmanager:latest .
kubectl apply -f deployments/k8s/clawmanager.yaml
```

## 环境变量

### 后端
- `SERVER_ADDRESS`: 绑定地址 (默认 `:9001`)
- `DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME`: MySQL 连接
- `JWT_SECRET`: JWT 签名密钥
- `K8S_MODE/K8S_NAMESPACE/K8S_STORAGE_CLASS`: K8s 设置
- `OBJECT_STORAGE_*`: S3/MinIO (技能存储)
- `SKILL_SCANNER_*`: 技能扫描服务 (可选)

### 前端
- `VITE_API_URL`: 后端 API URL (默认 `/api/v1`)