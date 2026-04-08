import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Agent Orch',
  description: 'A pluggable AI Agent orchestration framework for TypeScript',
  lang: 'en-US',
  cleanUrls: true,
  lastUpdated: true,
  ignoreDeadLinks: true,

  markdown: {
    lineNumbers: true,
  },

  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/introduction' },
      { text: 'Concepts', link: '/concepts/architecture' },
      { text: 'Advanced', link: '/advanced/custom-tools' },
      { text: 'API', link: '/api/' },
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Introduction', link: '/guide/introduction' },
            { text: 'Getting Started', link: '/guide/getting-started' },
            { text: 'Project Structure', link: '/guide/project-structure' },
            { text: 'Configuration', link: '/guide/configuration' },
            { text: 'CLI Commands', link: '/guide/cli-commands' },
          ],
        },
      ],
      '/concepts/': [
        {
          text: 'Core Concepts',
          items: [
            { text: 'Architecture', link: '/concepts/architecture' },
            { text: 'Agent', link: '/concepts/agent' },
            { text: 'Orchestration', link: '/concepts/orchestration' },
            { text: 'SingleAgent Pattern', link: '/concepts/single-agent' },
            { text: 'PlannerExecutor Pattern', link: '/concepts/planner-executor' },
            { text: 'Reflextion Pattern', link: '/concepts/reflextion' },
            { text: 'Stream Events', link: '/concepts/stream-events' },
            { text: 'Tools', link: '/concepts/tools' },
            { text: 'LLM Providers', link: '/concepts/llm-providers' },
          ],
        },
      ],
      '/advanced/': [
        {
          text: 'Advanced',
          items: [
            { text: 'Custom Tools', link: '/advanced/custom-tools' },
            { text: 'Custom Patterns', link: '/advanced/custom-patterns' },
            { text: 'Message Compression', link: '/advanced/compression' },
            { text: 'Tool Confirmation', link: '/advanced/confirmation' },
            { text: 'Nested Orchestration', link: '/advanced/nested-orchestration' },
          ],
        },
      ],
      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Development Setup', link: '/contributing/development' },
            { text: 'Coding Standards', link: '/contributing/coding-standards' },
            { text: 'Pull Requests', link: '/contributing/pull-requests' },
          ],
        },
      ],
      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
          ],
        },
        {
          text: '@agent-orch/core',
          collapsed: false,
          items: [
            { text: 'Overview', link: '/api/@agent-orch/core/' },
            {
              text: 'Classes',
              collapsed: true,
              items: [
                { text: 'AsyncEventGenerator', link: '/api/@agent-orch/core/classes/AsyncEventGenerator' },
                { text: 'Message', link: '/api/@agent-orch/core/classes/Message' },
                { text: 'StreamEventCollector', link: '/api/@agent-orch/core/classes/StreamEventCollector' },
              ],
            },
            {
              text: 'Interfaces',
              collapsed: true,
              items: [
                { text: 'AgentConfig', link: '/api/@agent-orch/core/interfaces/AgentConfig' },
                { text: 'CTX', link: '/api/@agent-orch/core/interfaces/CTX' },
                { text: 'FinishReason', link: '/api/@agent-orch/core/interfaces/FinishReason' },
                { text: 'Hook', link: '/api/@agent-orch/core/interfaces/Hook' },
                { text: 'LLM', link: '/api/@agent-orch/core/interfaces/LLM' },
                { text: 'LLMConfig', link: '/api/@agent-orch/core/interfaces/LLMConfig' },
                { text: 'MessageFactory', link: '/api/@agent-orch/core/interfaces/MessageFactory' },
                { text: 'OrchConfig', link: '/api/@agent-orch/core/interfaces/OrchConfig' },
                { text: 'StreamEvent', link: '/api/@agent-orch/core/interfaces/StreamEvent' },
                { text: 'StreamEventDataMap', link: '/api/@agent-orch/core/interfaces/StreamEventDataMap' },
                { text: 'Tool', link: '/api/@agent-orch/core/interfaces/Tool' },
                { text: 'ToolCall', link: '/api/@agent-orch/core/interfaces/ToolCall' },
                { text: 'ToolContext', link: '/api/@agent-orch/core/interfaces/ToolContext' },
                { text: 'ToolResult', link: '/api/@agent-orch/core/interfaces/ToolResult' },
              ],
            },
            {
              text: 'Type Aliases',
              collapsed: true,
              items: [
                { text: 'OrchType', link: '/api/@agent-orch/core/type-aliases/OrchType' },
                { text: 'StreamEventType', link: '/api/@agent-orch/core/type-aliases/StreamEventType' },
                { text: 'TypedStreamEvent', link: '/api/@agent-orch/core/type-aliases/TypedStreamEvent' },
                { text: 'UserInput', link: '/api/@agent-orch/core/type-aliases/UserInput' },
              ],
            },
            {
              text: 'Functions',
              collapsed: true,
              items: [
                { text: 'createLogger', link: '/api/@agent-orch/core/functions/createLogger' },
                { text: 'isEventType', link: '/api/@agent-orch/core/functions/isEventType' },
                { text: 'isOrchConfig', link: '/api/@agent-orch/core/functions/isOrchConfig' },
                { text: 'retry', link: '/api/@agent-orch/core/functions/retry' },
              ],
            },
          ],
        },
        {
          text: '@agent-orch/llm',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/@agent-orch/llm/' },
            {
              text: 'Classes',
              collapsed: true,
              items: [
                { text: 'OpenAILLM', link: '/api/@agent-orch/llm/classes/OpenAILLM' },
                { text: 'OpenAIMessage', link: '/api/@agent-orch/llm/classes/OpenAIMessage' },
                { text: 'OpenAIMessageFactory', link: '/api/@agent-orch/llm/classes/OpenAIMessageFactory' },
              ],
            },
            {
              text: 'Functions',
              collapsed: true,
              items: [
                { text: 'createLLM', link: '/api/@agent-orch/llm/functions/createLLM' },
                { text: 'convertToolsToOpenAI', link: '/api/@agent-orch/llm/functions/convertToolsToOpenAI' },
              ],
            },
          ],
        },
        {
          text: '@agent-orch/react-agent',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/@agent-orch/react-agent/' },
            {
              text: 'Classes',
              collapsed: true,
              items: [
                { text: 'Agent', link: '/api/@agent-orch/react-agent/classes/Agent' },
              ],
            },
            {
              text: 'Interfaces',
              collapsed: true,
              items: [
                { text: 'ConfirmationEvent', link: '/api/@agent-orch/react-agent/interfaces/ConfirmationEvent' },
                { text: 'ConfirmationRequest', link: '/api/@agent-orch/react-agent/interfaces/ConfirmationRequest' },
                { text: 'ConfirmationResult', link: '/api/@agent-orch/react-agent/interfaces/ConfirmationResult' },
              ],
            },
            {
              text: 'Functions',
              collapsed: true,
              items: [
                { text: 'compact', link: '/api/@agent-orch/react-agent/functions/compact' },
                { text: 'microcompact', link: '/api/@agent-orch/react-agent/functions/microcompact' },
              ],
            },
          ],
        },
        {
          text: '@agent-orch/orch',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/@agent-orch/orch/' },
            {
              text: 'Classes',
              collapsed: true,
              items: [
                { text: 'PatternFactory', link: '/api/@agent-orch/orch/classes/PatternFactory' },
                { text: 'SingleAgentPattern', link: '/api/@agent-orch/orch/classes/SingleAgentPattern' },
                { text: 'PlannerExecutorPattern', link: '/api/@agent-orch/orch/classes/PlannerExecutorPattern' },
                { text: 'ReflextionPattern', link: '/api/@agent-orch/orch/classes/ReflextionPattern' },
                { text: 'TaskGraph', link: '/api/@agent-orch/orch/classes/TaskGraph' },
                { text: 'FeedbackStore', link: '/api/@agent-orch/orch/classes/FeedbackStore' },
              ],
            },
            {
              text: 'Interfaces',
              collapsed: true,
              items: [
                { text: 'PatternRunner', link: '/api/@agent-orch/orch/interfaces/PatternRunner' },
                { text: 'PatternDeps', link: '/api/@agent-orch/orch/interfaces/PatternDeps' },
                { text: 'TaskNode', link: '/api/@agent-orch/orch/interfaces/TaskNode' },
              ],
            },
          ],
        },
        {
          text: '@agent-orch/tool',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/@agent-orch/tool/' },
            {
              text: 'Functions',
              collapsed: true,
              items: [
                { text: 'createSetTodoTool', link: '/api/@agent-orch/tool/functions/createSetTodoTool' },
                { text: 'createGetTodoTool', link: '/api/@agent-orch/tool/functions/createGetTodoTool' },
              ],
            },
          ],
        },
        {
          text: '@agent-orch/appkit',
          collapsed: true,
          items: [
            { text: 'Overview', link: '/api/@agent-orch/appkit/' },
            {
              text: 'Classes',
              collapsed: true,
              items: [
                { text: 'AgentOrch', link: '/api/@agent-orch/appkit/classes/AgentOrch' },
                { text: 'SessionStore', link: '/api/@agent-orch/appkit/classes/SessionStore' },
                { text: 'ChatStreamProcessor', link: '/api/@agent-orch/appkit/classes/ChatStreamProcessor' },
              ],
            },
            {
              text: 'Interfaces',
              collapsed: true,
              items: [
                { text: 'HarnessConfig', link: '/api/@agent-orch/appkit/interfaces/HarnessConfig' },
                { text: 'OrchEntry', link: '/api/@agent-orch/appkit/interfaces/OrchEntry' },
                { text: 'ChatMessage', link: '/api/@agent-orch/appkit/interfaces/ChatMessage' },
                { text: 'SessionData', link: '/api/@agent-orch/appkit/interfaces/SessionData' },
              ],
            },
            {
              text: 'Functions',
              collapsed: true,
              items: [
                { text: 'defineConfig', link: '/api/@agent-orch/appkit/functions/defineConfig' },
              ],
            },
          ],
        },
      ],
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/IanYu-Tree/agent-orch' },
    ],

    search: {
      provider: 'local',
    },

    footer: {
      message: 'Released under the MIT License.',
    },
  },
})
