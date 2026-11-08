# 多 OpenCode 实例协作与任务自动路由：可行性研究

> 研究日期：2026-11-08  
> 本机环境：OpenCode CLI **1.3.15**（macOS）  
> 范围：只做研究与方案设计，不修改任何配置或代码。

---

## 0. 结论摘要

**一句话结论：官方没有现成的“多实例任务队列/自动路由”，但用 OpenCode Server API + 一个几百行的路由脚本 + git worktree，可以在不引入 LangGraph/CrewAI 等重型框架的前提下，稳定跑 3–5 个并行编码 Agent。**

关键判断：

1. **官方能力足够做底座，但没有编排层。** OpenCode 提供 headless server、会话、异步 prompt、SSE 事件、权限审批、diff、token/cost 字段；没有任务队列、没有跨实例调度、没有 worktree 管理。见 [Server 文档](https://opencode.ai/docs/server/) 与 [SDK 文档](https://opencode.ai/docs/sdk/)。
2. **生态里有真实项目，但大多不是“多进程 + 多 worktree”的编排。** 多数是单会话内的 subagent 角色编排（OAK、opencode-orchestrator、oh-my-opencode），少数真正做并行 worktree（opencode-swarm、swarm-tools、opencode-supertask），且正处在 OpenCode V1 → V2 的迁移期，兼容性要逐项验证。见 [OpenCode 插件目录](https://opencode.im/categories/agents-workflows)。
3. **通用框架里，最适合“同一仓库不同任务线”的是 LangGraph（做控制面）和 OpenHands/CAID（做 worktree + branch + merge 的工程范式），不是 CrewAI/MetaGPT。** CrewAI/MetaGPT 的强项是角色协作和 SOP，不是仓库级隔离与合并；AutoGen/AG2 更偏消息驱动的研究型多 Agent。见 [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)、[CAID 论文/博客](https://www.openhands.dev/blog/asynchronous-software-engineering-agents)。
4. **最小方案的核心不是“让 Agent 互相聊天”，而是“让 Agent 各自在独立 worktree 里干活，由一个串行路由器负责派单、计时、计费、收 diff、审查、合并”。** 实测 `POST /session?directory=...` 和 `x-opencode-directory` 都能把会话绑定到不同目录，因此既可以“一 worktree 一 server”，也可以“一个 server 多目录”。建议 3–5 个 Agent 用前者，故障隔离更干净。
5. **最大风险不是并发写文件，而是合并冲突、成本失控、端口暴露和无人值守时的权限阻塞。** worktree 只解决“同时写同一个文件”，不解决“语义冲突”；必须配合文件触碰集（touch set）调度、串行合并、每轮测试。

---

## 1. 证据等级说明

本文把“事实”和“推测”分开标注：

| 标记 | 含义 |
|---|---|
| **【实测】** | 我在本机 OpenCode 1.3.15 上实际调用验证过 |
| **【文档】** | OpenCode 官方文档或项目官方文档明确写了 |
| **【社区】** | 项目 README / 插件目录的声明，未独立验证其质量与兼容性 |
| **【推测】** | 基于架构和经验的推断，需要在你环境中验证 |
| **【建议】** | 我给出的工程建议，不是既成事实 |

外部结论均附链接。插件星数、下载量等会变化，引用时以链接页面为准。

---

## 2. 问题一：OpenCode 官方/社区是否已有“多实例编排、任务队列、自动路由”？

### 2.1 官方：有底座，没有编排

**【文档】官方没有提供跨实例的任务队列、自动路由或 worktree 调度功能。** 与本问题直接相关的官方能力主要是四类：

| 能力 | 说明 | 链接 |
|---|---|---|
| Subagent | 父 Agent 通过 `subagent` 工具启动子会话，子会话有独立上下文；父级用权限控制能启动哪些子 Agent | [Agents](https://opencode.ai/docs/agents/) |
| Server API | `opencode serve` 暴露 HTTP API；`/session`、`/session/:id/message`、`/session/:id/prompt_async`、`/event` 等 | [Server](https://opencode.ai/docs/server/) |
| SDK | `@opencode-ai/sdk` 类型安全客户端；`session.create`、`session.prompt`、`event.subscribe` | [SDK](https://opencode.ai/docs/sdk/) |
| ACP | `opencode acp` 作为 ACP 子进程接入 Zed/JetBrains 等编辑器 | [ACP](https://opencode.ai/docs/acp/) |

**【实测】本机 1.3.15 的 `/doc` 只文档化了 `/global/*` 端点**，`/session`、`/config`、`/app`、`/agent` 等端点实际存在但未出现在 OpenAPI 的 `paths` 里。因此：

- 不要依赖 `/doc` 做客户端生成；
- 更可靠的类型来源是安装包里的 SDK 类型文件（本机路径：`~/.cache/opencode/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`）；
- 升级版本时要用真实请求回归，不能只看 OpenAPI。

**【实测】本机验证到的端点行为：**

| 请求 | 结果 |
|---|---|
| `GET /global/health` | `{"healthy":true,"version":"1.3.15"}` |
| `POST /session?directory=/abs/path` | 会话的 `directory` 字段变成该路径 |
| `POST /session` + `x-opencode-directory: /abs/path` | 同样生效 |
| `POST /session/:id/message`（`noReply:true`） | 返回 user message + parts |
| `POST /session/:id/prompt_async` | `204 No Content` |
| `GET /session/:id/message` | `[{info, parts}, ...]` |
| `GET /session/:id/diff` | `FileDiff[]`，空会话为 `[]` |
| `POST /session/:id/abort` | `true` |
| `GET /session/status` | 空闲时为 `{}` |
| `GET /event` | 首条 `data: {"type":"server.connected",...}` |
| 无认证请求 | `401` |
| `GET /agent` | 返回 agent 列表（含 build/plan 等） |
| `GET /config/providers` | 返回 provider 与默认模型 |

**【实测】`opencode run` 支持远程附着**：

```bash
opencode run --attach http://127.0.0.1:4101 --dir /path/to/worktree \
  --password "$OPENCODE_SERVER_PASSWORD" "实现 T-101"
```

这意味着路由器可以用 HTTP API，也可以用 `opencode run --attach` 作为兜底；后者更适合人工接管或脚本化的一次性任务。

### 2.2 社区：真实存在的项目（按“是否真的做多实例/多 worktree”分类）

#### A. OpenCode 原生插件：角色编排为主

| 项目 | 形态 | 关键事实 | 链接 |
|---|---|---|---|
| **OAK（OpenCode Agent Orchestration Kit）** | 配置 + 脚本 + agent 角色 | 明确说自己是“bounded engineering workflows”，**不做**大规模并行 worktree；`/autonomous` 合同甚至禁止 worktree、并行执行和调度；有 `oak run` / `oak deliver`、durable state、reviewer 独立审查 | [GitHub](https://github.com/jcarlosrodicio/opencode-agent-orchestration-kit) |
| **opencode-orchestrator** | OpenCode 插件（npm） | Commander/Planner/Worker/Reviewer 四角色；mission 状态存 `.opencode/`；**2.0.20+ 只支持 OpenCode 2**，1.x 要用 2.0.19 或更早 | [GitHub](https://github.com/agnusdei1207/opencode-orchestrator) |
| **oh-my-opencode / OmO** | 插件/独立 harness | 多模型、多角色、后台 agent；插件目录显示它是 OpenCode 版 OmO；上游 `oh-my-openagent` 已迁移到独立 `omo` harness，不再是纯 OpenCode 插件 | [插件页](https://opencode.im/plugin/oh-my-opencode)、[OmO](https://github.com/code-yeongyu/oh-my-openagent) |
| **oh-my-opencode-slim** | 插件 | 轻量多 agent 套件，自动委派、模型预设 | [GitHub](https://github.com/alvinunreal/oh-my-opencode-slim) |
| **opencode-workflows** | 插件 | 按顺序跑可恢复 workflow，阶段内有界并发，产物写 run 目录；作者声明在 OpenCode 2.1.4 测试 | [插件页](https://opencode.im/plugin/opencode-workflows) |
| **opencode-orchestrate / opencode-squad** | 插件 | plan → execute → review；项目已改名 opencode-squad；插件页星数很低 | [插件页](https://opencode.im/plugin/opencode-orchestrate) |

#### B. 真正做“并行 + 文件/ worktree 隔离”的项目

| 项目 | 关键事实 | 链接 |
|---|---|---|
| **opencode-swarm（ZaxbyHub）** | Architect 主导的 swarm；**coder 在隔离 worktree 中并行**，但只在“声明 scope 不冲突”时并行；有 file scope 持久化、shell 写检测、reviewer/test gate；Epic Mode 按 wave 跑冲突-free 任务，`/swarm epic close`  squash-land | [GitHub](https://github.com/ZaxbyHub/opencode-swarm) |
| **swarm-tools（joelhooks）** | `/swarm` 分解任务、spawn worker；**file reservations** 做写冲突避免；Swarm Mail 做 agent 间消息；Hive 是 git-backed 任务跟踪；本地 libSQL 事件存储 | [GitHub](https://github.com/joelhooks/swarm-tools) |
| **opencode-supertask** | 不是“多 agent 协作”，而是**持久任务队列**：SQLite WAL、cron/延迟/周期、重试、并发上限、优先级、依赖、取消、执行历史、本地 Dashboard；每个任务记录 project directory、agent、model、variant；底层是 `opencode run` | [GitHub](https://github.com/vbgate/opencode-supertask) |
| **opencode-scheduler** | 用 macOS launchd / Linux systemd / Windows Task Scheduler 做**定时任务**，不是并发编排 | [GitHub](https://github.com/different-ai/opencode-scheduler) |
| **opencode-worktree（kdcokenny）** | V1 时代的 worktree 插件，自动开终端、同步文件、退出清理；**2026-09-16 已归档，明确不移植到 V2** | [GitHub](https://github.com/kdcokenny/opencode-worktree) |

**【社区】OAK 的对比文档还提到 `opencode-agent-tree`，但该 GitHub 链接当前返回 404，无法核实，故不计入可用项目。** 这也说明该生态的项目存活率不高，选型时要看最近提交和归档状态。

**【社区】opencode-worktree 的归档说明提到 “Use OpenCode V2's native workspace/worktree workflows”，暗示 V2 可能提供原生 workspace/worktree 能力；本机 1.3.15 未验证到该能力。** 如果你计划升级 V2，先核对[官方迁移文档](https://opencode.ai/v2/docs/migrate-v1)，不要假设 V1 插件能直接复用。

#### C. 通用“并行编码 Agent”桌面/CLI 工具（支持 OpenCode 或任意 CLI）

这类工具不是 OpenCode 插件，而是“外部控制面”，通常自己管理 worktree、终端和 diff 审查：

| 工具 | 形态 | 链接 |
|---|---|---|
| Conductor | macOS，闭源，支持 Claude Code / Codex / Cursor / OpenCode，worktree 隔离 | [conductor.build](https://conductor.build/) |
| Vibe Kanban | Apache-2.0，看板式多 CLI agent；社区消息称原公司在 2026-04 后停止运营、转为社区维护，采用前要核对 release | [GitHub](https://github.com/BloopAI/vibe-kanban) |
| OpenChamber | 开源工作区，桌面/浏览器/编辑器/移动端，支持并行模型运行和 per-run worktree | [GitHub](https://github.com/openchamber/openchamber) |
| Cezar | 开源 orchestrator/ADE，支持 Claude Code、Codex、OpenCode、Pi，本地或自托管服务器 | [GitHub](https://github.com/open-mercato/cezar) |
| Rove | TUI orchestrator，每个任务一个 git worktree + branch，session 可 detach/恢复，`rove api` 可派单 | [GitHub](https://github.com/Sma1lboy/rove) |
| axel | 任务队列 + 终端复用器，队列派发给 Claude/Codex/OpenCode，统一 inbox 审批 | [GitHub](https://github.com/txtx/axel) |
| openkanban | 终端里的看板，编排编码 Agent | [GitHub](https://github.com/TechDufus/openkanban) |

更完整的清单见 [awesome-agent-orchestrators](https://github.com/andyrewlee/awesome-agent-orchestrators)。

### 2.3 对问题一的判断

**【事实】截至 2026-11-08，没有发现“官方维护的、跨多个 OpenCode server 实例的任务队列 + 自动路由”项目。** 最接近的三个方向各有缺口：

- **OAK / opencode-orchestrator / oh-my-opencode**：强在单会话内的角色分工和流程约束，不强在“多实例并行 + 仓库隔离”。OAK 自己明确把“跨多 worktree 的自主并行”列为不适用场景（[README](https://github.com/jcarlosrodicio/opencode-agent-orchestration-kit)）。
- **opencode-swarm / swarm-tools**：真正处理了并行写冲突（worktree / file reservation），但它们是插件内的工作流，和“外部任务队列 + 多 server”不是同一层；且 OpenCode V1/V2 兼容性需要逐版本确认。
- **opencode-supertask**：真正做了持久队列、并发、重试、历史，但它调度的是 `opencode run` 子进程，不负责 worktree 生命周期、diff 审查和合并；更适合“批处理/定时任务”，不是“同一仓库多条任务线协作”。

**【建议】如果你要的是“3–5 个 Agent 并行处理同一仓库的不同任务线”，最稳的路线是：**

> 用 OpenCode Server API 做执行层，用 200–400 行的路由器做调度层，用 git worktree 做隔离层；不要试图把 OAK/swarm 插件改造成多实例调度器。

---

## 3. 问题二：通用多 Agent 框架对比

### 3.1 对比维度

针对“多个编码 Agent 并行处理同一仓库的不同任务线”，真正重要的维度是：

1. **任务路由**：能不能按依赖图/文件范围/优先级把任务派给不同 worker；
2. **并发模型**：并行是图分支、进程、容器还是消息驱动；
3. **仓库隔离**：有没有原生 git worktree / branch / merge 概念；
4. **成本控制**：有没有 token/费用预算、步数上限、模型分级；
5. **与 OpenCode 的集成成本**：能不能把 OpenCode 当成一个“执行节点”接进去。

### 3.2 总表

| 框架 | 任务路由 | 并发 | 仓库隔离（worktree） | 成本控制 | 适合做编码任务线吗 |
|---|---|---|---|---|---|
| **LangGraph** | 条件边、`Command`、`Send` fan-out，路由完全自定义 | 图 super-step 内并行；`Send` 可做 map-reduce | **无原生 worktree**，要自己写节点调用 git/OpenCode | 无内置预算；靠 LangSmith 追踪 + 自己记账；有 recursion limit | **适合做控制面**，不适合当执行器 |
| **CrewAI** | sequential / hierarchical；Flows 有 `@router`、`or_`/`and_`、事件驱动 | `kickoff_async`、异步 task；Flow 的多个 `@start` 可并行 | **无原生 worktree**；代码执行已弃用内置沙箱，建议 E2B/Modal | `max_iter`（默认 20）、`max_rpm`、`max_execution_time`、`usage_metrics` | 快速原型可以，仓库级隔离要自己补 |
| **AutoGen（Microsoft）** | AgentChat 的 GroupChat / Swarm / Magentic-One；Core 是 topic/subscription 消息路由 | Core 支持分布式 runtime（gRPC，实验性）；AgentChat 并发有限 | **无原生 worktree**；有 Docker code executor | 基本没有预算原语；靠外部观测 | 偏研究/对话型，不适合直接管仓库 |
| **AG2** | AutoGen 0.2 的社区分支；GroupChat、Swarm、handoff | 以会话/消息驱动为主 | **无原生 worktree** | 基本没有预算原语 | 同上 |
| **OpenHands** | Agent SDK + Agent Server；可自己写 manager/worker | 多 sandbox / 多 conversation 可并行 | **生态里有 CAID 范式**：manager 建依赖图，每个 engineer 一个 worktree，完成后 merge；但 worktree 逻辑是 CAID 项目，不是 OpenHands 内置 | 有 sandbox/资源控制；token 预算要自己做 | **工程范式最值得借鉴**，但比最小方案重 |
| **MetaGPT** | SOP 固定角色流水线（PM/架构/PM/工程师） | 以串行为主，按 SOP 推进 | **无 worktree** | 文档给了粗略成本示例（设计约 $0.2，完整项目约 $2.0） | 不适合“并行任务线”，适合从 0 生成项目 |
| **Claude-Flow / Ruflo** | swarm 拓扑（hierarchical/mesh/adaptive）、MCP 工具、memory | 多 agent swarm；但主要是 Claude Code / Codex 的 meta-harness | **无 OpenCode 原生 worktree 集成**；有 mission/console 概念 | 有 cost 面板/模型路由；具体预算能力要查版本 | 如果你用 Claude Code 可以考虑；对 OpenCode 不是首选 |

### 3.3 逐项说明

#### LangGraph

**【文档】** LangGraph 是低层编排运行时：图由共享状态、节点、边组成；节点在同一个 super-step 内可以并行；条件边可以返回节点名、节点名列表（fan-out）或 `Send` 对象（map-reduce）；有 checkpointer、interrupt、持久化和 streaming。见 [Overview](https://docs.langchain.com/oss/python/langgraph/overview) 与 [Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)。

**优点：**

- 路由逻辑是显式代码，不是“让 LLM 自己决定”，对编码任务更可控；
- 有 durable execution / checkpoint，适合长任务和失败恢复；
- 可以把“调用 OpenCode server”封装成一个节点，把“git worktree 创建/合并”封装成另一个节点；
- 有 `recursion_limit`（默认 10,007 super-steps）防止无限循环（[Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)）。

**缺点：**

- 不提供任何编码 Agent、worktree、diff、测试能力，全部要自己写；
- 成本控制没有内置预算，需要自己从 OpenCode 的 `info.cost` 累加，或在 LangSmith 里做追踪；
- 引入 Python 运行时和依赖，对“3–5 个任务”的量级偏重。

**【建议】** 如果你未来要做 20+ 任务、复杂依赖图、可恢复的长流程，用 LangGraph 做控制面是合理的；如果只是 3–5 个并行任务，一个 Node 脚本更简单。

#### CrewAI

**【文档】** CrewAI 的 `Process` 只有 sequential 和 hierarchical 两种；hierarchical 需要一个 manager LLM 或 manager agent 来分配任务、审查输出。Flows 是事件驱动的，支持 `@start`、`@listen`、`@router`、`or_`/`and_`、`@persist`、`@human_feedback`，多个 `@start` 可以并行。见 [Processes](https://docs.crewai.com/en/concepts/processes) 与 [Flows](https://docs.crewai.com/en/concepts/flows)。

**成本控制：**

- Agent 级 `max_iter`（默认 20）、`max_rpm`、`max_execution_time`、`max_retry_limit`（[Agents](https://docs.crewai.com/en/concepts/agents)）；
- Flow 级 `usage_metrics` 可以汇总一次 `kickoff()` 内所有 LLM 调用的 token（[Flows](https://docs.crewai.com/en/concepts/flows)）。

**问题：**

- 没有 git worktree / branch / merge 原语；
- 代码执行的内置沙箱已弃用，官方建议用 E2B/Modal（[Agents](https://docs.crewai.com/en/concepts/agents)）；
- hierarchical 的“manager 分配任务”是 LLM 决策，不如显式依赖图稳定；
- 对“同一仓库不同任务线”的合并冲突没有内建处理。

**【建议】** 适合做“研究/写作/分析”类多角色流程；做仓库级并行编码，需要自己补 worktree 和合并层，补完后并不比最小方案轻。

#### AutoGen / AG2

**【文档】** AutoGen 分 AgentChat（对话式单/多 Agent）和 Core（事件驱动、topic/subscription、可分布式 runtime）。Core 的 distributed agent runtime 是实验性的，host + worker 通过 gRPC 通信，支持跨进程/跨语言。见 [AutoGen 首页](https://microsoft.github.io/autogen/stable/) 与 [Distributed Agent Runtime](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/framework/distributed-agent-runtime.html)。

**优点：**

- 消息路由和分布式 runtime 的概念成熟；
- 有 GroupChat、Swarm、handoff、Mixture-of-Agents 等模式；
- 有 Docker code executor，可做执行隔离。

**缺点：**

- 没有 worktree/branch/merge；
- 没有成本预算原语；
- 对话式协调容易“聊起来很热闹，合并时一团糟”；
- AG2 是 AutoGen 0.2 的社区分支，生态分叉，选型时要确认维护状态（[AG2](https://docs.ag2.ai/latest/)）。

**【建议】** 除非你要研究多 Agent 协作协议，否则不建议用它管编码任务线。

#### OpenHands / CAID

**【文档】** OpenHands 提供 Agent SDK、Agent Server、Docker sandbox；可以本地跑，也可以每个 conversation 一个 sandbox。见 [OpenHands](https://github.com/OpenHands/OpenHands) 与 [Docker Sandbox](https://docs.openhands.dev/sdk/guides/agent-server/docker-sandbox)。

**最值得借鉴的是 CAID（CMU 的论文/博客，构建在 OpenHands 之上）：**

- manager 先探索任务，构建依赖图，判断哪些子任务可并行；
- 每个 engineer 一个独立 git worktree，分配结构化 JSON 指令；
- engineer 在自己的 worktree 里实现、跑测试、提交；
- 任意 engineer 完成后，manager 把分支 merge 回 main，解决冲突，并根据当前代码状态动态更新计划；
- 所有 manager↔engineer 通信走结构化 JSON + git commit，不走自由聊天；
- 消融实验：**去掉 worktree 隔离、让多个 Agent 编辑同一 workspace，性能显著下降**；
- 并行 Agent 数量超过“可并行子任务数”后收益递减；
- Commit0 提升 14.3 个百分点，PaperBench 提升 26.7 个百分点（[博客](https://www.openhands.dev/blog/asynchronous-software-engineering-agents)、[论文](https://arxiv.org/abs/2603.21489)）。

**【建议】** 这几乎就是问题三要的方案，只是 CAID 用 OpenHands 做执行器。你完全可以把“engineer”换成 OpenCode server 会话，把 manager 换成一个路由脚本。

#### MetaGPT

**【文档】** MetaGPT 的核心是 `Code = SOP(Team)`：把产品经理、架构师、项目经理、工程师等角色和标准作业程序固化成流水线，从一句需求生成用户故事、竞品分析、需求、数据结构、API、文档和代码。文档给的粗略成本：带分析/设计的示例约 $0.2，完整项目约 $2.0（[Introduction](https://docs.deepwisdom.ai/main/en/guide/get_started/introduction.html)）。

**问题：**

- 它是“从 0 生成一个项目”的瀑布式 SOP，不是“在现有仓库里并行处理多条任务线”；
- 没有 worktree/branch/merge；
- 角色流水线是串行的，并行度有限。

**【建议】** 不适合本问题；如果你要“从零生成一个 MVP”，可以另做评估。

#### Claude-Flow / Ruflo

**【社区】** `ruvnet/claude-flow` 现已改名/迁移为 `ruvnet/ruflo`，定位是 Claude Code / Codex 的 meta-harness：100+ agents、swarm 拓扑（hierarchical/mesh/adaptive）、MCP server、向量记忆、federation、console。见 [GitHub](https://github.com/ruvnet/ruflo)。

**问题：**

- 它不是 OpenCode 原生，主要面向 Claude Code / Codex；
- 没有 OpenCode 的 worktree/session 集成；
- 功能面很大，学习和运维成本高；
- 项目宣传性强，采用前要用自己的任务做小规模验证。

**【建议】** 如果你同时用 Claude Code，可以关注；如果主力是 OpenCode，不建议为了“多 Agent”引入它。

### 3.4 选型结论

**【建议】**

| 你的目标 | 推荐 |
|---|---|
| 3–5 个并行编码任务，尽快跑起来 | **OpenCode API + 薄路由器 + git worktree**（本文方案） |
| 20+ 任务、复杂依赖、需要断点恢复/可视化 | LangGraph 做控制面，OpenCode 做执行节点 |
| 想要“现成的多角色工程流程”，不追求多 worktree 并行 | OAK 或 opencode-orchestrator（注意 V1/V2 兼容） |
| 想要“插件内并行 + 文件锁/ worktree” | opencode-swarm 或 swarm-tools（先做兼容性验证） |
| 想要“持久任务队列/定时批处理” | opencode-supertask |
| 研究多 Agent 协作/长周期任务 | OpenHands + CAID 范式 |

---

## 4. 问题三：不引入重型框架的最小方案

### 4.1 设计原则

1. **执行与调度分离**：OpenCode 只负责“在一个目录里干活”，路由器负责“派单、计时、计费、收 diff、审查、合并”。
2. **一个任务一个 worktree**：worktree 是隔离边界，也是一个天然的“可丢弃沙箱”。
3. **一个任务一个会话**：不复用会话，避免上下文污染；审查用独立会话。
4. **路由器串行决策，Agent 并行执行**：路由器是单线程/单进程的，所有“创建 worktree、合并、清理”都串行；Agent 之间不直接通信。
5. **文件触碰集调度**：worktree 防的是“同时写同一个文件”，touch set 防的是“合并时才发现冲突”。
6. **人类保留合并权**：Agent 不 push、不 merge；路由器只做到“review_ready”，合并由人或 CI 完成。

### 4.2 拓扑：两种模式

#### 模式 A（推荐，3–5 个 Agent）：一个 worktree 一个 server

```
任务 T-101 ──► worktree ~/work/repo-wt/T-101 ──► opencode serve :4101 ──► session A
任务 T-102 ──► worktree ~/work/repo-wt/T-102 ──► opencode serve :4102 ──► session B
任务 T-103 ──► worktree ~/work/repo-wt/T-103 ──► opencode serve :4103 ──► session C
                              ▲
                              │ 串行派单/收结果/合并
                        router.mjs（单进程）
```

**优点：**

- 故障隔离：一个 server 崩了不影响其他任务；
- 配置隔离：每个 worktree 可以有独立的 `.opencode`、依赖、环境变量；
- 端口/认证边界清晰；
- 路由逻辑简单：不需要在每个请求上带 `directory`。

**缺点：**

- 3–5 个 Node 进程，内存占用更高；
- 每个 server 要单独管认证和日志；
- 需要端口池管理。

**启动方式（每个 worktree）：**

```bash
cd ~/work/repo-wt/T-101
OPENCODE_SERVER_PASSWORD="$OC_PASS" \
  opencode serve --hostname 127.0.0.1 --port 4101
```

#### 模式 B（更轻）：一个 server + 每请求 `directory`

**【实测】一个 server 可以通过 `?directory=` 或 `x-opencode-directory` 把不同会话绑定到不同目录。** 因此也可以：

```bash
cd ~/work/repo
OPENCODE_SERVER_PASSWORD="$OC_PASS" opencode serve --hostname 127.0.0.1 --port 4100
```

然后：

```bash
curl -u "opencode:$OC_PASS" -X POST \
  "http://127.0.0.1:4100/session?directory=$HOME/work/repo-wt/T-101" \
  -H 'content-type: application/json' \
  -d '{"title":"T-101"}'
```

**优点：** 一个进程、一个端口、一套认证，最省资源。

**缺点：**

- 共享故障域：server 崩了所有任务一起停；
- 共享插件/配置缓存，不同 worktree 的 `.opencode` 差异可能不生效或互相干扰；
- 所有会话在同一个 server 的 project 注册表里，排障时噪音更大；
- 需要每个请求都带 `directory`，漏带就会落到 server 启动目录。

**【建议】** 先用模式 B 做 1–2 天的可行性验证；稳定后切模式 A。两者 API 调用序列相同，只是 `baseUrl` 和是否带 `directory` 不同。

### 4.3 目录结构建议

把“控制面”放在主 worktree，把“执行面”放在兄弟目录的 worktree：

```
~/work/
├─ myrepo/                          # 主 worktree：人在这里工作，Agent 不写
│  ├─ .orchestrator/                # 控制面（加入 .gitignore，不提交）
│  │  ├─ router.mjs                 # 路由器（Node 22+，无第三方依赖）
│  │  ├─ config.json                # 端口池、模型、预算、并发上限
│  │  ├─ tasks/
│  │  │  ├─ T-101.json              # 任务元数据
│  │  │  ├─ T-101.md                # 任务正文（给 Agent 的 prompt）
│  │  │  └─ T-102.json / T-102.md
│  │  ├─ runs/
│  │  │  └─ T-101/
│  │  │     ├─ state.json           # 状态机
│  │  │     ├─ events.ndjson        # 原始 SSE 事件
│  │  │     ├─ result.md            # Agent 最终文本
│  │  │     ├─ review.md            # 审查结论
│  │  │     ├─ diff.patch           # git diff
│  │  │     ├─ diff.json            # /session/:id/diff 原始返回
│  │  │     └─ cost.json            # token/cost 汇总
│  │  └─ locks/                     # worktree 创建/合并的串行锁
│  ├─ src/
│  └─ ...
└─ myrepo-wt/                       # 执行面：每个任务一个 worktree
   ├─ T-101/                        # branch: agent/T-101
   ├─ T-102/                        # branch: agent/T-102
   └─ T-103/
```

**为什么 worktree 放在仓库外：**

- 避免 worktree 嵌套在主仓库里导致 `git status`、IDE 索引、文件搜索混乱；
- 避免 Agent 通过 `..` 看到控制面；
- `git worktree remove` 更干净。

**为什么 `.orchestrator/` 放在主仓库且不提交：**

- 路由器、任务、运行记录都在一个地方，方便人看；
- 不提交就不会被 `git worktree add` 带进执行 worktree，Agent 看不到；
- 如果团队要共享任务模板，可以把 `tasks/` 单独放一个控制仓库，而不是放进业务仓库。

### 4.4 任务描述格式

`tasks/T-101.json`：

```json
{
  "id": "T-101",
  "title": "给 /api/search 加分页限流",
  "base": "origin/main",
  "branch": "agent/T-101",
  "agent": "build",
  "model": { "providerID": "anthropic", "modelID": "claude-sonnet-5-5" },
  "prompt": "tasks/T-101.md",
  "touch": ["src/api/search/**", "tests/api/search/**"],
  "hot_files": ["package.json", "pnpm-lock.yaml"],
  "depends_on": [],
  "budget_usd": 3.0,
  "max_minutes": 45,
  "review": {
    "agent": "reviewer",
    "model": { "providerID": "anthropic", "modelID": "claude-haiku-4-5" }
  }
}
```

字段说明：

| 字段 | 作用 |
|---|---|
| `base` | worktree 从哪个 ref 切；建议 `origin/main`，不要用本地脏分支 |
| `branch` | 任务分支；命名 `agent/<id>`，方便清理 |
| `agent` | OpenCode 的 primary agent 名称；`build` 是默认编码 agent |
| `model` | 传给 `POST /session/:id/message` 的 `model` 对象；不填则用会话默认 |
| `touch` | 预计会写的文件 glob；用于并发调度和冲突预警 |
| `hot_files` | 锁文件、schema、迁移等“热点文件”；碰到就串行 |
| `depends_on` | 依赖的任务 id；依赖未 merged 不派单 |
| `budget_usd` | 路由器轮询 `info.cost`，超预算就 abort |
| `max_minutes` | 墙钟超时；超时 abort |
| `review` | 审查会话的 agent/model；建议用不同模型 |

`tasks/T-101.md` 是给 Agent 的正文，建议包含：

```markdown
# 目标
给 /api/search 增加分页和每 IP 限流。

# 验收标准
- 新增 `page`、`page_size` 参数，默认 1/20，最大 100。
- 超过 100 QPS 返回 429，带 Retry-After。
- 单元测试覆盖分页边界和限流。
- `pnpm test --filter api` 通过。

# 边界
- 只改 `src/api/search/**` 和 `tests/api/search/**`。
- 不要改 `package.json` / lockfile；需要新依赖先停下来报告。
- 不要 commit，不要 push；路由器会处理。

# 已知上下文
- 现有实现：`src/api/search/handler.ts`
- 限流中间件参考：`src/api/middleware/rate-limit.ts`
```

**【建议】任务正文要写“验收标准 + 边界 + 不要做什么”，比写“请实现 X”有效得多。** 这也是 OAK/swarm 这类项目强调“contract / scope”的原因（[OAK](https://github.com/jcarlosrodicio/opencode-agent-orchestration-kit)、[opencode-swarm](https://github.com/ZaxbyHub/opencode-swarm)）。

### 4.5 API 调用序列（核心）

**调用序列总览：**

```text
git worktree add
  → POST /session                              （创建实现会话）
  → POST /session/:id/prompt_async             （异步派单）
  → GET  /event                                （等 session.idle）
  → GET  /session/:id/message                  （读结果 + cost/tokens）
  → GET  /session/:id/diff                     （读结构化 diff）
  → git add/commit                             （路由器提交）
  → POST /session                              （创建审查会话）
  → POST /session/:id/prompt_async             （只读审查）
  → GET  /event                                （等 session.idle）
  → GET  /session/:id/message                  （读 APPROVE/REQUEST_CHANGES）
  → git merge --no-ff + 测试                   （串行合并）
  → git worktree remove                        （清理）
```

以下序列在 1.3.15 上验证过端点存在；`prompt_async`、`session.idle`、权限回复的值来自本机 SDK 类型与实测。

#### 步骤 0：准备 worktree（串行）

```bash
git -C ~/work/myrepo fetch origin
git -C ~/work/myrepo worktree add \
  -b agent/T-101 \
  ~/work/myrepo-wt/T-101 \
  origin/main
```

**注意：**

- `git worktree add/remove` 会写共享的 `.git/worktrees` 元数据，**必须串行**，不要 5 个任务同时执行；
- 重跑任务时不要用 `-B` 强制重置已有分支；先检查 `git rev-parse --verify agent/T-101`，存在就用 `git worktree add <path> agent/T-101`，不存在才 `-b`；
- 每个 worktree 需要自己的依赖目录（`node_modules`、`.venv`）。可以用 `pnpm install`、`uv sync`，或从主 worktree 复制/软链；软链有风险，建议安装。
- 把 worktree 路径、branch、base commit 写进 `runs/<id>/state.json`，方便恢复。

#### 步骤 1：创建会话

```bash
curl -s -u "opencode:$OC_PASS" \
  -X POST "http://127.0.0.1:4101/session" \
  -H 'content-type: application/json' \
  -d '{"title":"T-101 给 /api/search 加分页限流"}'
```

返回：

```json
{
  "id": "ses_...",
  "slug": "witty-rocket",
  "version": "1.3.15",
  "projectID": "...",
  "directory": "/Users/you/work/myrepo-wt/T-101",
  "title": "T-101 给 /api/search 加分页限流",
  "time": { "created": 1794114369117, "updated": 1794114369117 }
}
```

如果使用模式 B，加 `?directory=/Users/you/work/myrepo-wt/T-101`。

**可选：** 用 `parentID` 把同一任务的所有会话（实现、审查、修复）挂到一个父会话下，方便 UI 查看会话树：

```json
{ "parentID": "ses_parent...", "title": "T-101" }
```

`POST /session` 的 body 支持 `{ parentID?, title? }`（[Server 文档](https://opencode.ai/docs/server/)）。

#### 步骤 2：异步发指令

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  -u "opencode:$OC_PASS" \
  -X POST "http://127.0.0.1:4101/session/$SID/prompt_async" \
  -H 'content-type: application/json' \
  -d '{
    "agent": "build",
    "model": { "providerID": "anthropic", "modelID": "claude-sonnet-5-5" },
    "parts": [{ "type": "text", "text": "<T-101.md 的内容>" }]
  }'
```

返回 `204 No Content`。

**为什么用 `prompt_async` 而不是 `message`：**

- `POST /session/:id/message` 会等模型跑完才返回，HTTP 连接可能挂几十分钟；
- `prompt_async` 立即返回，路由器用 SSE/轮询等完成；
- 如果只需要“同步等一个短回答”，用 `message` 更简单。

**body 字段（来自 SDK 类型）：**

```ts
{
  messageID?: string;
  model?: { providerID: string; modelID: string };
  agent?: string;
  noReply?: boolean;
  system?: string;
  tools?: { [key: string]: boolean };
  parts: Array<TextPartInput | FilePartInput | AgentPartInput>;
}
```

来源：本机 `@opencode-ai/sdk` 的 `SessionPromptData` 类型；官方 [Server 文档](https://opencode.ai/docs/server/) 也列出了同样的字段。

#### 步骤 3：等待完成（SSE 优先，轮询兜底）

**SSE：**

```bash
curl -N -u "opencode:$OC_PASS" http://127.0.0.1:4101/event
```

事件流首条是：

```
data: {"type":"server.connected","properties":{}}
```

本机 SDK 类型里确认存在这些事件：

```ts
type EventSessionIdle = {
  type: "session.idle";
  properties: { sessionID: string };
};

type EventSessionError = {
  type: "session.error";
  properties: { sessionID?: string; error?: ... };
};

type EventPermissionUpdated = {
  type: "permission.updated";
  properties: Permission;
};
```

来源：本机 `~/.cache/opencode/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`；官方事件端点见 [Server 文档](https://opencode.ai/docs/server/)。

**路由器判断逻辑：**

```js
// 伪代码
for await (const event of sse) {
  if (event.type === "session.idle" && event.properties.sessionID === sid) {
    // 本轮结束
  }
  if (event.type === "session.error" && event.properties.sessionID === sid) {
    // 失败
  }
  if (event.type === "permission.updated" && event.properties.sessionID === sid) {
    // 按策略回复，见步骤 4
  }
}
```

**轮询兜底：**

```bash
GET /session/status
GET /session/:id/message?limit=5
```

本机实测：空闲时 `/session/status` 返回 `{}`；运行中会返回对应会话的状态（字段随版本变化，**不要依赖具体字段名，优先用 `session.idle` 事件**）。

#### 步骤 4：处理权限请求（无人值守的关键）

**【实测 + SDK 类型】权限回复端点是：**

```bash
POST /session/:id/permissions/:permissionID
Content-Type: application/json

{ "response": "once" }   // 或 "always" / "reject"
```

`response` 的枚举值来自本机 SDK 类型：`"once" | "always" | "reject"`。

`permission.updated` 事件里的 `Permission` 对象包含：

```ts
{
  id: string;
  type: string;          // 工具/权限类型
  pattern?: string | string[];
  sessionID: string;
  messageID: string;
  callID?: string;
  title: string;
  metadata: { [key: string]: unknown };
  time: { created: number };
}
```

**三种策略：**

| 策略 | 行为 | 适用 |
|---|---|---|
| `allow` | 对已知安全的读/写/测试命令回 `once` 或 `always` | 在 worktree 内、无网络、无 push |
| `reject` | 对危险命令回 `reject`，让 Agent 换方案 | `git push`、`rm -rf`、`curl`、`ssh`、`chmod 777` |
| `ask` | 写入 `pending_permissions.jsonl`，暂停任务，通知人 | 生产配置、密钥、迁移、依赖变更 |

**【建议】不要全局自动 `always`。** 最稳的是：在 Agent 配置里把危险动作设为 `deny`/`ask`，路由器只对“读、写 worktree 内文件、跑测试”自动放行；其余挂起等人。

#### 步骤 5：收集结果

```bash
# 消息（含 token/cost）
GET /session/:id/message?limit=50

# 会话 diff（结构化）
GET /session/:id/diff

# 会话状态
GET /session/status
```

**assistant message 的关键字段（本机 SDK 类型）：**

```ts
{
  role: "assistant";
  time: { created: number; completed?: number };
  error?: ProviderAuthError | UnknownError | MessageOutputLengthError | MessageAbortedError | ApiError;
  modelID: string;
  providerID: string;
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
}
```

这意味着路由器可以**按消息累计 cost 和 token**，不需要额外接计费系统。官方类型链接见 [SDK 文档](https://opencode.ai/docs/sdk/)。

**提取最终文本：**

```js
const assistant = messages.filter(m => m.info.role === "assistant").at(-1);
const text = assistant.parts
  .filter(p => p.type === "text")
  .map(p => p.text)
  .join("\n");
```

**检查错误：**

```js
if (assistant.info.error) {
  // ProviderAuthError / UnknownError / MessageOutputLengthError / MessageAbortedError / ApiError
}
```

**取 diff：**

```js
const diffs = await api(`/session/${sid}/diff`);
// FileDiff[]: { file, before, after, additions, deletions }
```

同时用 git 生成可审阅的 patch：

```bash
git -C ~/work/myrepo-wt/T-101 add -A
git -C ~/work/myrepo-wt/T-101 diff --cached > runs/T-101/diff.patch
```

#### 步骤 6：提交（路由器做，Agent 不做）

```bash
git -C ~/work/myrepo-wt/T-101 \
  commit -m "agent(T-101): 给 /api/search 加分页限流"
```

**为什么要路由器提交：**

- Agent 可能忘记 commit，或 commit 到错误的分支；
- 路由器可以统一 commit message、签名、hook；
- 便于在 commit 前做 secret 扫描、diff 大小检查。

**建议在 Agent 的 prompt 和权限里明确：**

- 不要 `git commit`；
- 不要 `git push`；
- 不要 `git checkout` / `git reset` / `git clean`；
- 不要改 `.git/**`。

#### 步骤 7：独立审查

用同一 worktree、新建一个会话，指定只读 reviewer agent：

```bash
POST /session
{ "title": "T-101 review" }

POST /session/$REVIEW_SID/prompt_async
{
  "agent": "reviewer",
  "model": { "providerID": "anthropic", "modelID": "claude-haiku-4-5" },
  "parts": [{
    "type": "text",
    "text": "审查 agent/T-101 相对 origin/main 的 diff。只读，不要改文件。按严重程度列出问题；最后一行输出 APPROVE 或 REQUEST_CHANGES。\n\n<diff.patch 内容或让 Agent 自己跑 git diff>"
  }]
}
```

**reviewer agent 配置建议（版本相关）：**

OpenCode 1.3.15 属于 V1 线，agent frontmatter 使用 `permission` 映射；V2 改为 `permissions` 数组。两种字段在官方配置 schema 里都存在（`PermissionConfig` 与 `Permission.Ruleset`），但语义不同，**升级前要用 `opencode agent list` 和实际版本回归**。

**注意 mode：** `mode: subagent` 的 agent 只能由父 Agent 通过 `subagent` 工具启动，不能作为顶层会话的 `agent` 字段。路由器要“直接创建一个审查会话”，reviewer 必须用 `mode: primary` 或 `mode: all`；如果 reviewer 只作为 subagent 被调用，才用 `mode: subagent`（[Agents 文档](https://opencode.ai/docs/agents/)）。

V1 风格（`https://opencode.ai/config.json` 的 `PermissionConfig` 确认支持 `permission.edit` / `permission.bash`）：

```md
---
description: 只读代码审查
mode: all
model: anthropic/claude-haiku-4-5
permission:
  edit: deny
  bash: deny
---
你只做代码审查。不要修改文件，不要执行会改变仓库状态的命令。
按严重程度列出问题，附文件与行号。最后一行只写 APPROVE 或 REQUEST_CHANGES。
```

V2 风格（官方文档示例，`mode` 改为 `all` 以便路由器直接选为顶层 agent）：

```md
---
description: Reviews changes for correctness and regressions
mode: all
model: anthropic/claude-sonnet-5-5
permissions:
  - action: edit
    resource: "*"
    effect: deny
  - action: shell
    resource: "*"
    effect: deny
---
Review the current changes. List findings in severity order with file and line references.
```

来源：[Agents 文档](https://opencode.ai/docs/agents/)、[配置 schema](https://opencode.ai/config.json)。

**审查产物：**

- `runs/T-101/review.md`：reviewer 的完整输出；
- `runs/T-101/review.json`：解析出的 `APPROVE` / `REQUEST_CHANGES` 和问题列表；
- 如果 `REQUEST_CHANGES`，路由器可以再开一个修复会话（同一 worktree），或直接挂起等人。

#### 步骤 8：串行合并

不要让 Agent 合并。用一个单线程的 `integrator`：

```bash
# 1. 切到集成分支
git -C ~/work/myrepo checkout integration
git -C ~/work/myrepo pull --ff-only origin integration

# 2. 按顺序合并已 review_ready 的任务
git -C ~/work/myrepo merge --no-ff agent/T-101 -m "merge T-101"

# 3. 每合一个跑测试
pnpm test   # 或 make test / uv run pytest

# 4. 失败就回滚，标记 needs_human
git merge --abort
```

**为什么串行：**

- worktree 只隔离“写”，不隔离“合并”；
- 两个 Agent 都改了同一个函数的不同部分，merge 可能语义冲突；
- 每合一个跑一次测试，能定位是哪个任务引入的回归；
- 合并顺序按 `depends_on` 和 `touch` 重叠度排，先合低风险、被依赖的任务。

**合并后：**

```bash
git -C ~/work/myrepo push origin integration
gh pr create --base main --head integration --title "Agent batch: T-101..T-103"
```

或者每个任务一个 PR，用 GitHub merge queue 串行合并。

#### 步骤 9：清理

```bash
# 保留分支，删除 worktree
git -C ~/work/myrepo worktree remove ~/work/myrepo-wt/T-101
# 可选：删除已合并分支
git -C ~/work/myrepo branch -d agent/T-101
```

**清理也要串行**，并先确认：

- 分支已合并或已放弃；
- worktree 里没有未提交的改动（`git status --porcelain` 为空）；
- 没有 server 还在使用这个目录（先停 server）。

### 4.6 路由器伪代码（可直接改成 Node 脚本）

```js
// router.mjs — Node 22+，无第三方依赖
import { readFile, writeFile, mkdir, appendFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);
const cfg = JSON.parse(await readFile(".orchestrator/config.json", "utf8"));
const MAX_PARALLEL = cfg.maxParallel ?? 3;

// ---- 1. 载入任务 ----
const tasks = await loadTasks(".orchestrator/tasks");
const running = new Map(); // id -> { sid, server, startedAt, cost }

// ---- 2. 调度循环 ----
while (true) {
  const ready = tasks.filter(t =>
    t.state === "queued" &&
    depsMerged(t) &&
    !overlapsRunning(t) &&
    !touchesHotFileWithRunning(t)
  );

  while (running.size < MAX_PARALLEL && ready.length) {
    const task = ready.shift();
    await dispatch(task); // 创建 worktree + server + session + prompt_async
  }

  await sleep(5000);
}

// ---- 3. 派单 ----
async function dispatch(task) {
  const wt = `${cfg.worktreeRoot}/${task.id}`;
  await withLock("worktree", async () => {
    await exec("git", ["-C", cfg.repo, "worktree", "add", "-B", task.branch, wt, task.base]);
  });

  const port = await acquirePort();
  const server = await startServer(wt, port); // opencode serve --hostname 127.0.0.1 --port
  const sid = await createSession(server, task);

  await promptAsync(server, sid, {
    agent: task.agent,
    model: task.model,
    parts: [{ type: "text", text: await readFile(task.prompt, "utf8") }],
  });

  running.set(task.id, { sid, server, startedAt: Date.now(), cost: 0 });
  task.state = "running";
  await saveState(task);
}

// ---- 4. 事件循环 ----
async function watch(server, sid, task) {
  for await (const ev of sse(server, "/event")) {
    if (ev.type === "permission.updated" && ev.properties.sessionID === sid) {
      await handlePermission(server, sid, ev.properties, task);
    }
    if (ev.type === "session.idle" && ev.properties.sessionID === sid) {
      await finish(task, server, sid);
      return;
    }
    if (ev.type === "session.error" && ev.properties.sessionID === sid) {
      await fail(task, ev.properties.error);
      return;
    }
  }
}

// ---- 5. 收尾 ----
async function finish(task, server, sid) {
  const messages = await api(server, `/session/${sid}/message?limit=200`);
  const assistant = messages.filter(m => m.info.role === "assistant").at(-1);
  const cost = messages.reduce((n, m) => n + (m.info.cost ?? 0), 0);

  await writeFile(`runs/${task.id}/result.md`, extractText(assistant));
  await writeFile(`runs/${task.id}/cost.json`, JSON.stringify({
    cost,
    tokens: assistant?.info.tokens,
  }, null, 2));
  await writeFile(`runs/${task.id}/diff.json`, JSON.stringify(
    await api(server, `/session/${sid}/diff`), null, 2));

  await exec("git", ["-C", task.worktree, "add", "-A"]);
  await exec("git", ["-C", task.worktree, "commit", "-m", `agent(${task.id}): ${task.title}`]);
  await exec("sh", ["-c", `git -C ${task.worktree} diff origin/main...HEAD > runs/${task.id}/diff.patch`]);

  task.state = "review_ready";
  await saveState(task);
}

// ---- 6. 预算/超时监控 ----
setInterval(async () => {
  for (const [id, r] of running) {
    const messages = await api(r.server, `/session/${r.sid}/message?limit=200`);
    const cost = messages.reduce((n, m) => n + (m.info.cost ?? 0), 0);
    if (cost > tasks.find(t => t.id === id).budget_usd) {
      await api(r.server, `/session/${r.sid}/abort`, { method: "POST" });
      await fail(tasks.find(t => t.id === id), "budget_exceeded");
    }
    if (Date.now() - r.startedAt > task.max_minutes * 60_000) {
      await api(r.server, `/session/${r.sid}/abort`, { method: "POST" });
      await fail(task, "timeout");
    }
  }
}, 15_000);
```

**说明：**

- `api()` 要带 Basic Auth：`Authorization: Basic base64("opencode:" + password)`；
- `sse()` 要处理 `\n\n` 分帧和 `data:` 前缀；
- `withLock()` 用 `flock` 或原子 `mkdir` 实现；
- 端口池从 `4101` 开始，任务结束释放；
- 所有状态写 `runs/<id>/state.json`，进程重启后能恢复。

### 4.7 并发与冲突规则（建议直接写进路由器）

| 规则 | 原因 |
|---|---|
| `MAX_PARALLEL` 默认 3，最大 5 | 超过 5 后收益递减、review 带宽不够、provider 限流；CAID 也观察到并行数超过可并行子任务后收益递减（[博客](https://www.openhands.dev/blog/asynchronous-software-engineering-agents)） |
| 一个 worktree 只跑一个任务 | 避免同一目录被两个会话写；也方便 diff/commit |
| 同一 `touch` glob 的任务不并行 | 降低合并冲突；worktree 不能防语义冲突 |
| 碰到 `hot_files` 的任务独占运行 | lockfile/schema/迁移是全局共享，必须串行 |
| `git worktree add/remove` 串行 | 共享 `.git/worktrees` 元数据，并发会踩锁 |
| 合并串行，每合一个跑测试 | 定位回归；避免“一次合 5 个，炸了不知道是谁” |
| Agent 不 push、不 merge | 保留人类/CI 的最终控制权 |
| 失败任务不自动重试超过 2 次 | 防止成本失控；重试前先看 `events.ndjson` |

### 4.8 成本控制（具体做法）

| 手段 | 做法 | 依据 |
|---|---|---|
| 每任务预算 | `budget_usd` + 路由器每 15s 累计 `info.cost`，超了就 `abort` | 本机 SDK 类型确认 assistant message 有 `cost` |
| 墙钟超时 | `max_minutes`，超时 `abort` | 防止卡死的工具循环 |
| 模型分级 | 实现用强模型；探索/测试/审查用便宜模型 | 多 Agent 成本主要来自重复读上下文和工具循环 |
| 步数上限 | agent 配置 `steps`；旧字段 `maxSteps` 已废弃 | 官方 [Agents](https://opencode.ai/docs/agents/) 与 [配置 schema](https://opencode.ai/config.json) |
| 工具裁剪 | `tools` 字段关闭不需要的 MCP/websearch | `POST /session/:id/message` body 支持 `tools` |
| 一会话一任务 | 不复用会话，减少上下文膨胀 | 子 Agent 本身是 fresh context（[Agents](https://opencode.ai/docs/agents/)） |
| 缓存友好 | 稳定前缀（AGENTS.md）+ 任务正文放末尾 | 供应商 prompt cache 依赖前缀稳定；OAK 也强调保留 conversation prefix（[OAK](https://github.com/jcarlosrodicio/opencode-agent-orchestration-kit)） |
| 成本归档 | 每任务 `cost.json`，按任务/模型汇总 | 便于下一批任务调参 |

**成本量级（推测，需实测）：**

- 一个 30–60 分钟的编码任务，强模型 + 多轮工具调用，成本可能是“单次聊天”的 5–20 倍；
- 并行 3 个任务，不是线性 3 倍，因为 review、合并、重跑也会增加；
- 用便宜模型做 review 能显著降本，但审查质量要抽检。

### 4.9 可审查性（结果怎么给人看）

每个任务目录固定包含：

| 文件 | 内容 | 用途 |
|---|---|---|
| `state.json` | 状态机、worktree、branch、base commit、时间戳 | 恢复/排障 |
| `events.ndjson` | 原始 SSE 事件 | 复盘 Agent 做了什么 |
| `result.md` | 最终 assistant 文本 | 快速看结论 |
| `diff.patch` | `git diff origin/main...HEAD` | 代码审查 |
| `diff.json` | `/session/:id/diff` | 结构化文件变更 |
| `review.md` | reviewer 输出 | 独立审查 |
| `cost.json` | cost/token 汇总 | 成本归因 |

**人工审查顺序建议：**

1. 看 `review.md` 的结论和问题列表；
2. 看 `diff.patch` 的文件范围和行数；
3. 跑测试；
4. 看 `events.ndjson` 里有没有危险命令/异常重试；
5. 决定 merge / 打回 / 放弃。

**人工接管：**

```bash
opencode attach http://127.0.0.1:4101 --dir ~/work/myrepo-wt/T-101
```

`opencode attach` 支持 `--dir`、`--session`、`--continue`、`--password`（本机 `--help` 实测）。适合在 Agent 卡住时直接接管，而不是杀进程重来。

### 4.10 一天能跑通的最小版本（建议顺序）

| 步骤 | 做什么 | 验收 |
|---|---|---|
| 1 | 固定 OpenCode 1.3.15，手动创建 1 个 worktree + 1 个 server | `GET /global/health` 返回 1.3.15 |
| 2 | 手动 `POST /session` + `prompt_async` + `GET /event` | 能看到 `session.idle`，能读回 assistant 文本 |
| 3 | 手动 `GET /session/:id/diff` + `git diff` | diff 一致 |
| 4 | 写路由器 MVP：派单、等 idle、存 result/diff/cost | 一个任务端到端跑通 |
| 5 | 加 reviewer 会话 + `review.md` | reviewer 能输出 APPROVE/REQUEST_CHANGES |
| 6 | 加预算/超时/权限处理 | 超预算能 abort；危险命令被拒 |
| 7 | 加到 3 个并行任务 | 3 个 worktree、3 个 server、无写冲突 |
| 8 | 加串行合并 + 每合一个测试 | 集成分支可回滚 |
| 9 | 跑一周，记录冲突率/成本/审查时间 | 再决定是否上 LangGraph 或插件 |

---

## 5. 问题四：风险清单

### 5.1 并发写同一仓库

**【事实】** git worktree 让每个任务有独立工作目录和分支，避免“同时写同一个文件”。Git 官方文档：worktree 是“一个仓库的多个工作树”，共享 `.git` 目录（[git-worktree](https://git-scm.com/docs/git-worktree)）。

**【事实】** CAID 的消融实验显示：去掉 worktree 隔离、让多个 Agent 编辑同一 workspace，性能显著下降（[博客](https://www.openhands.dev/blog/asynchronous-software-engineering-agents)）。

**但 worktree 不解决：**

- **合并冲突**：两个任务改了同一函数的相邻行，merge 时才冲突；
- **语义冲突**：一个任务重命名函数，另一个任务调用旧名字，merge 可能“成功”但运行时失败；
- **共享 `.git` 的并发操作**：同时 `git worktree add/remove`、同时 `git gc`、同时写 refs 可能踩锁；
- **共享外部资源**：数据库、端口、Docker、`node_modules` 缓存、测试 fixture。

**缓解：**

- touch set 调度 + hot files 串行；
- 串行合并 + 每合一个跑测试；
- Agent 禁止 `git push` / `git reset` / `git clean` / `git worktree`；
- 测试用独立数据库/端口（每个 worktree 一套 env）；
- 合并前 rebase 到最新 integration，早暴露冲突。

### 5.2 模型成本

**【事实】** 并行 Agent 会显著增加 token 消耗；OpenCode 的 assistant message 带 `cost` 和 `tokens`（本机 SDK 类型）。**【文档】** 官方 Server/SDK 文档里没有看到内置的“任务预算”或“全局预算”端点，预算需要路由器自己实现（[Server 文档](https://opencode.ai/docs/server/)、[SDK 文档](https://opencode.ai/docs/sdk/)）。

**风险：**

- 工具循环/重试导致成本失控；
- 长上下文重复读仓库；
- 免费模型限流/排队，导致任务卡住而不是失败；
- 并行 5 个任务时，provider 速率限制可能让所有任务一起变慢；
- 审查会话也要钱，容易被忽略。

**缓解：**

- 路由器强制 `budget_usd` + `max_minutes`；
- 模型分级，review 用便宜模型；
- 限制 `steps`、关闭不需要的工具/MCP；
- 每任务 `cost.json`，按周复盘；
- 免费模型只用于探索/测试，不用于关键实现。

### 5.3 无认证暴露端口

**【事实】** `opencode serve` 默认绑定 `127.0.0.1`；设置 `OPENCODE_SERVER_PASSWORD` 启用 HTTP Basic Auth，用户名默认 `opencode`，可用 `OPENCODE_SERVER_USERNAME` 覆盖（[Server 文档](https://opencode.ai/docs/server/)）。本机实测无认证请求返回 `401`。

**风险：**

- 如果 `--hostname 0.0.0.0` 且没有密码，等于把“文件读写 + shell 执行”暴露给整个网络；
- Basic Auth 是明文凭据（HTTP 不加密），在不可信网络可被嗅探；
- `--mdns` 会把服务广播到局域网；
- `--cors` 配错会让浏览器端跨域调用；
- Agent 本身可能执行 `curl`/`ssh`，把数据带出去。

**缓解：**

- 永远绑定 `127.0.0.1`；
- 必须设 `OPENCODE_SERVER_PASSWORD`，每个 worktree 用不同密码；
- 远程访问用 SSH 隧道：`ssh -L 4101:127.0.0.1:4101 host`；
- 需要公网/团队访问时，前置带 TLS 的反向代理（Caddy/Nginx），并加 IP allowlist；
- 不用 `--mdns`；
- Agent 权限里 deny 网络命令（`curl`、`wget`、`ssh`、`scp`）。

**【推测】** OpenCode 的 Basic Auth 不提供 TLS，也不提供细粒度 token；如果你要多用户/审计，必须自己加代理层。

### 5.4 上下文污染

**【事实】** 子 Agent 在子会话中以 fresh context 运行（[Agents 文档](https://opencode.ai/docs/agents/)）。但如果你复用同一个主会话跑多个任务，历史会不断累积。

**风险：**

- 任务 A 的讨论污染任务 B 的判断；
- 长历史导致模型忽略最新指令；
- 压缩（compaction）丢关键细节；
- 审查会话看到实现会话的“自我辩护”，不够独立。

**缓解：**

- 一任务一会话；任务结束就 `DELETE /session/:id` 或归档；
- 实现和审查用不同会话、不同模型；
- 任务正文用文件（`tasks/T-101.md`），不要靠聊天历史传递；
- 需要背景知识时用 `noReply:true` 注入一次，而不是反复对话；
- 每个 worktree 的 `AGENTS.md` 保持稳定、简短。

### 5.5 其他风险

| 风险 | 说明 | 缓解 |
|---|---|---|
| 版本漂移 | OpenCode V1/V2 配置字段不同；插件在迁移期；`/doc` 不完整 | 固定 1.3.15；升级前跑回归；读 SDK 类型 |
| 插件兼容 | opencode-orchestrator 2.0.20+ 只支持 V2；opencode-worktree 已归档 | 选项目看最近提交/归档状态；先在分支试 |
| 依赖目录 | 每个 worktree 要独立 `node_modules`/`.venv`，磁盘和安装时间翻倍 | 用 pnpm store / uv cache；必要时软链但要注意写冲突 |
| 测试资源 | 并行测试抢端口/数据库 | 每 worktree 独立 env；测试用随机端口/临时库 |
| Secret 泄漏 | Agent 能读 `.env`、`~/.ssh` | 权限 deny；worktree 不放 secret；用环境变量注入 |
| 权限阻塞 | `ask` 策略下无人值守会卡住 | SSE 处理 `permission.updated`；或预配置 allow/deny |
| 合并顺序 | 后合的任务可能依赖先合的任务 | `depends_on` + touch 重叠度排序 |
| 磁盘增长 | worktree、依赖、日志累积 | 合并后清理；日志轮转；保留最近 N 天 |

---

## 6. 建议的落地路线

### 阶段 0：验证（半天）

- 固定 OpenCode 1.3.15；
- 手动创建 1 个 worktree + 1 个 server；
- 用 curl 跑通 `session → prompt_async → event → message → diff → abort`；
- 确认 `session.idle`、`permission.updated`、`info.cost` 在你环境里可用。

### 阶段 1：单任务端到端（1 天）

- 写 `router.mjs` 的派单/等待/收结果；
- 产物落 `runs/<id>/`；
- 人工看 `diff.patch` 和 `result.md`。

### 阶段 2：审查与合并（1–2 天）

- 加 reviewer 会话；
- 加串行 integrator；
- 每合一个跑测试；
- 失败回滚。

### 阶段 3：3–5 并行（1 周）

- 加 touch set 调度、hot files 串行；
- 加预算/超时/权限策略；
- 跑真实任务，记录：
  - 每任务成本；
  - 合并冲突率；
  - review 打回率；
  - 人工审查时间；
  - 端到端墙钟时间。

### 阶段 4：再决定要不要上框架

如果出现以下情况，再考虑 LangGraph 或现成插件：

- 任务数 > 10，依赖图复杂；
- 需要断点恢复、可视化、审计；
- 需要跨机器/跨团队调度；
- 现有路由器维护成本超过收益。

---

## 7. 最终建议（给决策者）

**【建议】**

1. **不要等“官方编排功能”。** 截至 2026-11-08，官方没有这个路线图；现有能力（server + session + event + diff + cost）已经足够拼一个最小方案。
2. **不要一上来引入 LangGraph/CrewAI。** 你的量级是 3–5 个并行任务，一个 Node 脚本 + git worktree 更可控；LangGraph 的价值在 20+ 任务和复杂依赖图。
3. **不要把“多 Agent 聊天”当成目标。** 目标是“任务不冲突、结果可审查、成本可归因”。Agent 之间不需要聊天，路由器串行决策就够了。
4. **worktree 是必要条件，不是充分条件。** 还要 touch set、串行合并、每轮测试；否则你只是把冲突从“写文件”推迟到“merge”。
5. **先做“可审查”，再做“全自动”。** 第一版路由器只做到 `review_ready`，合并由人做；稳定后再加自动合并/PR。
6. **安全边界要一开始就定。** 绑定 127.0.0.1、强密码、SSH 隧道、Agent 禁 push/网络命令；不要等出事再补。

---

## 8. 附录：关键端点速查

| 方法 | 路径 | 用途 | 备注 |
|---|---|---|---|
| GET | `/global/health` | 健康检查/版本 | 实测 |
| GET | `/event` | SSE 事件流 | 实测；`session.idle`、`permission.updated` 等 |
| POST | `/session` | 创建会话 | body `{parentID?, title?}`；支持 `?directory=` / `x-opencode-directory` |
| GET | `/session` | 列出会话 | 实测 |
| GET | `/session/status` | 所有会话状态 | 空闲为 `{}` |
| GET | `/session/:id` | 会话详情 | 文档 |
| DELETE | `/session/:id` | 删除会话 | 文档 |
| POST | `/session/:id/message` | 同步发消息 | 等模型跑完才返回 |
| POST | `/session/:id/prompt_async` | 异步发消息 | 实测 204 |
| GET | `/session/:id/message` | 读消息 | 返回 `{info, parts}[]` |
| GET | `/session/:id/message/:messageID` | 单条消息 | 文档 |
| GET | `/session/:id/diff` | 会话 diff | 实测 `FileDiff[]` |
| POST | `/session/:id/abort` | 中止 | 实测 `true` |
| POST | `/session/:id/permissions/:permissionID` | 回复权限 | body `{response:"once"\|"always"\|"reject"}` |
| GET | `/agent` | 列出 agent | 实测 |
| GET | `/config` | 当前配置 | 实测 |
| GET | `/config/providers` | provider/默认模型 | 实测 |
| GET | `/doc` | OpenAPI | 实测只含 `/global/*`，不完整 |

官方端点表：[Server 文档](https://opencode.ai/docs/server/)。  
SDK 类型：[SDK 文档](https://opencode.ai/docs/sdk/)；本机类型文件：`~/.cache/opencode/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts`。

### 8.1 本机实测复现（不触发模型调用）

以下命令用于验证端点存在和 `directory` 绑定；`noReply:true` 不会调用模型，适合做冒烟测试：

```bash
# 1. 启动
OPENCODE_SERVER_PASSWORD=testpass \
  opencode serve --hostname 127.0.0.1 --port 4599

# 2. 健康检查
curl -s -u opencode:testpass http://127.0.0.1:4599/global/health
# {"healthy":true,"version":"1.3.15"}

# 3. 创建会话并绑定目录（query 方式）
curl -s -u opencode:testpass -X POST \
  'http://127.0.0.1:4599/session?directory=/tmp/ocprobe-a' \
  -H 'content-type: application/json' \
  -d '{"title":"dir-query"}'
# 返回的 "directory" 为 "/private/tmp/ocprobe-a"
# 记下返回的 id，后续用 SID=ses_...

# 4. 创建会话并绑定目录（header 方式）
curl -s -u opencode:testpass -X POST http://127.0.0.1:4599/session \
  -H 'content-type: application/json' \
  -H 'x-opencode-directory: /tmp/ocprobe-b' \
  -d '{"title":"dir-header"}'

# 5. 异步发消息（noReply 不调用模型）
curl -s -o /dev/null -w "%{http_code}\n" \
  -u opencode:testpass -X POST \
  "http://127.0.0.1:4599/session/$SID/prompt_async" \
  -H 'content-type: application/json' \
  -d '{"noReply":true,"parts":[{"type":"text","text":"context only"}]}'
# 204

# 6. 读消息 / diff / abort
curl -s -u opencode:testpass "http://127.0.0.1:4599/session/$SID/message"
curl -s -u opencode:testpass "http://127.0.0.1:4599/session/$SID/diff"
curl -s -u opencode:testpass -X POST "http://127.0.0.1:4599/session/$SID/abort"

# 7. SSE
curl -N -u opencode:testpass --max-time 2 http://127.0.0.1:4599/event
# data: {"type":"server.connected","properties":{}}

# 8. 无认证应 401
curl -s -o /dev/null -w "%{http_code}\n" \
  -X POST http://127.0.0.1:4599/session/x/prompt_async
# 401
```

SDK 类型核对：

```bash
SDK=~/.cache/opencode/node_modules/@opencode-ai/sdk/dist/gen/types.gen.d.ts
grep -n "export type AssistantMessage" -A 30 "$SDK"   # cost / tokens
grep -n "session.idle\|session.error\|permission.updated" "$SDK"
grep -n 'response: "once" | "always" | "reject"' "$SDK"
```

---

## 9. 参考链接汇总

### OpenCode 官方

- [Server](https://opencode.ai/docs/server/)
- [SDK](https://opencode.ai/docs/sdk/)
- [Agents](https://opencode.ai/docs/agents/)
- [Plugins](https://opencode.ai/docs/plugins/)
- [ACP](https://opencode.ai/docs/acp/)

### OpenCode 生态项目

- [OAK](https://github.com/jcarlosrodicio/opencode-agent-orchestration-kit)
- [opencode-orchestrator](https://github.com/agnusdei1207/opencode-orchestrator)
- [oh-my-opencode 插件页](https://opencode.im/plugin/oh-my-opencode)
- [oh-my-openagent / OmO](https://github.com/code-yeongyu/oh-my-openagent)
- [oh-my-opencode-slim](https://github.com/alvinunreal/oh-my-opencode-slim)
- [opencode-swarm](https://github.com/ZaxbyHub/opencode-swarm)
- [swarm-tools](https://github.com/joelhooks/swarm-tools)
- [opencode-supertask](https://github.com/vbgate/opencode-supertask)
- [opencode-scheduler](https://github.com/different-ai/opencode-scheduler)
- [opencode-workflows](https://opencode.im/plugin/opencode-workflows)
- [opencode-worktree（已归档）](https://github.com/kdcokenny/opencode-worktree)
- [OpenCode 插件目录](https://opencode.im/categories/agents-workflows)
- [awesome-agent-orchestrators](https://github.com/andyrewlee/awesome-agent-orchestrators)

### 通用框架

- [LangGraph Overview](https://docs.langchain.com/oss/python/langgraph/overview)
- [LangGraph Graph API](https://docs.langchain.com/oss/python/langgraph/graph-api)
- [LangGraph Persistence](https://docs.langchain.com/oss/python/langgraph/persistence)
- [LangGraph Interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts)
- [CrewAI Processes](https://docs.crewai.com/en/concepts/processes)
- [CrewAI Agents](https://docs.crewai.com/en/concepts/agents)
- [CrewAI Flows](https://docs.crewai.com/en/concepts/flows)
- [AutoGen](https://microsoft.github.io/autogen/stable/)
- [AutoGen Distributed Agent Runtime](https://microsoft.github.io/autogen/stable/user-guide/core-user-guide/framework/distributed-agent-runtime.html)
- [AG2](https://docs.ag2.ai/latest/)
- [OpenHands](https://github.com/OpenHands/OpenHands)
- [OpenHands Docker Sandbox](https://docs.openhands.dev/sdk/guides/agent-server/docker-sandbox)
- [CAID 博客](https://www.openhands.dev/blog/asynchronous-software-engineering-agents)
- [CAID 论文](https://arxiv.org/abs/2603.21489)
- [MetaGPT Introduction](https://docs.deepwisdom.ai/main/en/guide/get_started/introduction.html)
- [Ruflo / Claude-Flow](https://github.com/ruvnet/ruflo)

### Git / 工程实践

- [git-worktree](https://git-scm.com/docs/git-worktree)
- [Claude Code worktrees](https://code.claude.com/docs/en/worktrees)
