# OpenClaw 第一轮裁剪执行清单

## 目标形态

- 情感陪伴、自用精简版
- 运行环境：Mac 本地
- 交互方式：WebChat / Control UI 聊天为主
- 仅保留单一 main agent
- 不需要多 Agent
- 不需要聊天渠道接入
- 不需要邮件、日历、Webhook、智能家居、节点管理
- 不需要语音、TTS、实时语音、电话、媒体生成
- 不需要代码开发相关工具
- 需要保留文档处理能力

## 第一轮原则

第一轮不要直接拆核心运行时，不要先改插件装载机制，不要先改 Gateway 主流程。

第一轮只做四件事：

1. 先用配置把不需要的能力关掉
2. 再删除不需要的 bundled extensions
3. 再删除不需要的 apps 和文档目录
4. 最后再收敛 CLI 命令入口和帮助信息

这样做的目标是：先让产品形态收缩，再让代码体积收缩，避免一开始打断核心依赖链。

## 当前已落地

- 已新增第一轮 CLI 收口档位：`OPENCLAW_PRODUCT_PROFILE=local-solo`
- 已新增快捷入口：`pnpm openclaw:local-solo -- --help`
- 当前这个档位会先隐藏多 Agent、channels、nodes、webhooks、qa、TUI/chat 等明显不需要的 CLI 表面
- 这一步只收口命令入口，不直接删除实现和插件装载链，便于继续做下一轮裁剪

## 必须保留

以下部分第一轮不要动：

- `src/gateway/`
- `src/agents/`
- `src/plugins/`
- `src/plugin-sdk/`
- `src/commands/`
- `src/cli/`
- `src/channels/`
- `ui/`
- `package.json`
- `scripts/`

保留原因：

- `src/gateway/` 提供本地 Gateway、WebSocket、Control UI / WebChat 路由和会话控制。
- `src/agents/` 提供 main agent 运行时、工具编排、模型调用、工作区和会话逻辑。
- `src/plugins/` 和 `src/plugin-sdk/` 是 provider 与文档处理插件的装载基础。
- `ui/` 是 WebChat / Control UI 需要的前端资源。
- `src/commands/` 和 `src/cli/` 里仍然要保留最小 CLI 表面，例如 `gateway`、`agent`、`status`、`doctor`、`setup`、`models`、`sessions`。

## 第一轮保留的插件

### 至少保留一个模型 Provider

本地优先，二选一：

- `extensions/ollama/`
- `extensions/lmstudio/`

云端优先，二选一：

- `extensions/openai/`
- `extensions/anthropic/`

建议第一轮最多保留 2 个 Provider，不要保留更多。

### 文档处理相关

必须保留：

- `extensions/document-extract/`

按需保留：

- `extensions/file-transfer/`：如果希望 agent 直接浏览和读取本地目录中的文档
- `extensions/web-readability/`：如果希望读取网页正文并提取可读内容

### 可选保留

- `extensions/memory-core/`：如果你仍希望保留基础记忆检索

如果目标是更极简，可以第一轮先不动 memory，等系统稳定后再继续裁。

## 第一轮删除清单

以下目录适合第一轮直接删除。

### A. 所有聊天渠道插件

删除：

- `extensions/bluebubbles/`
- `extensions/discord/`
- `extensions/feishu/`
- `extensions/googlechat/`
- `extensions/imessage/`
- `extensions/irc/`
- `extensions/line/`
- `extensions/matrix/`
- `extensions/mattermost/`
- `extensions/msteams/`
- `extensions/nextcloud-talk/`
- `extensions/nostr/`
- `extensions/qqbot/`
- `extensions/signal/`
- `extensions/slack/`
- `extensions/synology-chat/`
- `extensions/telegram/`
- `extensions/tlon/`
- `extensions/twitch/`
- `extensions/voice-call/`
- `extensions/whatsapp/`
- `extensions/zalo/`
- `extensions/zalouser/`
- `extensions/google-meet/`
- `extensions/device-pair/`

说明：

- 这些模块的价值主要在外部聊天渠道、电话、设备配对，不符合当前产品目标。

### B. 语音、TTS、实时语音、媒体理解和媒体生成

删除：

- `extensions/azure-speech/`
- `extensions/elevenlabs/`
- `extensions/gradium/`
- `extensions/inworld/`
- `extensions/microsoft/`
- `extensions/speech-core/`
- `extensions/tts-local-cli/`
- `extensions/deepgram/`
- `extensions/senseaudio/`
- `extensions/image-generation-core/`
- `extensions/video-generation-core/`
- `extensions/media-understanding-core/`
- `extensions/alibaba/`
- `extensions/byteplus/`
- `extensions/comfy/`
- `extensions/fal/`
- `extensions/groq/`
- `extensions/runway/`
- `extensions/together/`
- `extensions/vydra/`

说明：

- 这批模块主要覆盖 STT、TTS、图像、视频、音乐、媒体理解等能力。
- 如果未来要恢复 PDF 图文提取，`document-extract` 本身应先保留。

### C. 浏览器、搜索、代码开发和自动化工具相关插件

删除：

- `extensions/browser/`
- `extensions/brave/`
- `extensions/duckduckgo/`
- `extensions/exa/`
- `extensions/firecrawl/`
- `extensions/google/`
- `extensions/perplexity/`
- `extensions/searxng/`
- `extensions/tavily/`
- `extensions/diffs/`
- `extensions/lobster/`
- `extensions/llm-task/`
- `extensions/open-prose/`
- `extensions/skill-workshop/`
- `extensions/tokenjuice/`
- `extensions/acpx/`
- `extensions/codex/`
- `extensions/github-copilot/`
- `extensions/kilocode/`
- `extensions/kimi-coding/`
- `extensions/opencode/`
- `extensions/opencode-go/`
- `extensions/copilot-proxy/`
- `extensions/migrate-claude/`
- `extensions/migrate-hermes/`

说明：

- 这些模块主要服务开发、搜索、外部浏览器控制、代码代理和迁移工具。

### D. Webhook、节点、对外集成、沙箱和外部控制面

删除：

- `extensions/webhooks/`
- `extensions/openshell/`
- `extensions/bonjour/`
- `extensions/phone-control/` 如果存在于当前工作树

说明：

- 当前产品是本机自用，不需要对外 webhook，也不需要多节点和远程设备控制。

### E. QA、诊断和测试专用插件

删除：

- `extensions/qa-channel/`
- `extensions/qa-lab/`
- `extensions/qa-matrix/`
- `extensions/diagnostics-otel/`
- `extensions/diagnostics-prometheus/`
- `extensions/test-support/`
- `extensions/synthetic/`

## Provider 第一轮保留建议

从下列方案中选一个：

### 方案 A：纯本地

- 保留 `extensions/ollama/`
- 删除其他绝大多数 provider

### 方案 B：本地 + 云端兜底

- 保留 `extensions/ollama/`
- 保留 `extensions/openai/` 或 `extensions/anthropic/`
- 删除其他 provider

### 方案 C：纯云端

- 保留 `extensions/openai/` 或 `extensions/anthropic/`
- 删除其他 provider

如果没有明确需要，不要保留以下大批 provider：

- `amazon-bedrock`
- `amazon-bedrock-mantle`
- `anthropic-vertex`
- `arcee`
- `cerebras`
- `chutes`
- `cloudflare-ai-gateway`
- `deepinfra`
- `deepseek`
- `fireworks`
- `huggingface`
- `litellm`
- `microsoft-foundry`
- `minimax`
- `mistral`
- `moonshot`
- `nvidia`
- `openrouter`
- `qianfan`
- `qwen`
- `sglang`
- `stepfun`
- `tencent`
- `venice`
- `vercel-ai-gateway`
- `vllm`
- `volcengine`
- `voyage`
- `xiaomi`
- `zai`

## Apps 第一轮删除清单

删除：

- `apps/android/`
- `apps/ios/`
- `apps/macos/`
- `apps/macos-mlx-tts/`

保留：

- `ui/`

说明：

- 当前目标是通过 WebChat / Control UI 使用本地 Gateway，不需要原生桌面和移动端壳。

## Docs 第一轮删除清单

在代码稳定后，再删除以下文档目录或页面：

- `docs/channels/` 中绝大部分渠道文档
- `docs/providers/` 中被删除 provider 对应文档
- `docs/platforms/android.md`
- `docs/platforms/ios.md`
- `docs/platforms/macos.md`
- `docs/tools/tts.md`
- `docs/tools/music-generation.md`
- `docs/tools/video-generation.md`
- `docs/tools/browser.md`
- `docs/tools/web-fetch.md` 如果决定不保留网页相关能力
- `docs/tools/subagents.md`
- `docs/tools/acp-agents.md`

说明：

- 文档删除要放在代码裁剪之后，避免在尚未完成功能清理时先造成文档和代码双重漂移。

## 配置层第一轮收口

第一轮先通过配置把目标产品形态固定下来，不要一开始就删核心运行时代码。

### 约束方向

- 不配置 `agents.list`
- 只使用默认 `main`
- 不配置 `bindings`
- 不启用 channels
- 不启用 nodes / devices
- 不启用语音
- 禁止 subagent 相关工具
- 禁止开发型工具

### 建议配置草案

```json5
{
  agents: {
    defaults: {
      workspace: "~/.openclaw/workspace",
    },
  },
  tools: {
    profile: "minimal",
    alsoAllow: ["message", "read"],
    deny: [
      "exec",
      "process",
      "browser",
      "nodes",
      "cron",
      "gateway",
      "agents_list",
      "sessions_spawn",
      "sessions_yield",
      "subagents",
    ],
  },
}
```

备注：

- 这里只是第一轮约束方向，不代表最终生产配置。
- 如果文档处理主要依赖上传 PDF，而不是主动读本地目录，可以进一步评估是否保留 `read`。

## CLI 第一轮收口清单

第一轮先隐藏或弱化以下命令入口，不建议马上删除底层实现：

- `agents`
- `channels`
- `devices`
- `nodes`
- `pairing`
- `browser`
- `webhooks`
- `proxy`
- `mcp`
- `cron`
- `skills` 如果不准备保留技能体系
- `plugins` 如果不希望最终产品暴露插件管理

第一轮建议继续保留以下命令：

- `gateway`
- `agent`
- `status`
- `doctor`
- `setup`
- `configure`
- `models`
- `sessions`

## 实施顺序

### 第 1 步：配置收口

- 只保留 `main`
- 禁用 subagent、nodes、cron、browser、exec
- 保持 WebChat / Control UI 可用

### 第 2 步：删除大块 extensions

按以下顺序删：

1. channels
2. voice / speech / media generation
3. qa / diagnostics
4. browser / search / dev tools
5. 大部分 provider

### 第 3 步：删除 apps

- 删除 `apps/android/`
- 删除 `apps/ios/`
- 删除 `apps/macos/`
- 删除 `apps/macos-mlx-tts/`

### 第 4 步：收口 CLI

- 隐藏无关命令
- 更新帮助信息和 onboarding 路径

### 第 5 步：清理文档和测试

- 删除无关文档
- 删除对应测试和脚本
- 收口 package.json scripts

## 第一轮完成后的最小验证

至少执行：

```bash
pnpm install
pnpm build
pnpm ui:build
pnpm openclaw setup
pnpm openclaw gateway --port 18789
```

然后在浏览器中验证：

- WebChat / Control UI 可以打开
- 可以发起 main agent 对话
- 可以正常查看历史 session
- 可以上传或处理 PDF / 文档
- 不再出现渠道、节点、语音、Webhook 相关入口

## 第一轮暂不做的事

- 不重写插件系统
- 不移除 session 存储
- 不移除 `src/channels/` 共享抽象层
- 不删除 `src/gateway/` 中 WebChat 依赖的通用 session / auth 逻辑
- 不立即删除所有 CLI 底层实现

## 风险提示

### 风险 1：删掉 channels 插件后，部分共享类型或测试会失败

处理方式：

- 先删除插件目录
- 再跑构建
- 按报错补删对应测试、注册清单、帮助文案和 docs

### 风险 2：删掉过多 provider 后，默认模型配置失效

处理方式：

- 先明确只保留哪一个或两个 provider
- 再同步更新默认模型配置和 onboarding 文案

### 风险 3：删掉 apps 后，仍有脚本或文档引用它们

处理方式：

- 第二轮统一清理 `package.json` scripts、README、docs 和 CI 配置

## 第二轮预告

第二轮再做这些事：

- 删除无关 CLI 命令实现
- 删除无关 docs 和 tests
- 清理 package.json 依赖与 scripts
- 进一步裁掉多 Agent 专用代码入口和帮助文案
- 必要时为“本地单机 WebChat 版”增加单独的产品配置模板
