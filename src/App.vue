<template>
  <a-split class="wh-full" :style="{ border: '1px solid var(--color-border)' }" v-model:size="size" min="400px"
    max="1000px" @move-start="docMask = true" @move-end="docMask = false">
    <template #first>
      <a-typography-paragraph>
        <div class="wh-full">
          <a-tabs type="line" size="large" class="wh-full flex flex-col" v-model:active-key="tab">
            <a-tab-pane key="ai" title="AI 提问">
              <a-spin :loading="isLoading" tip="模型输出中" class="wh-full">
                <Ai :vars="vars" @send-request="sendRequest" />
              </a-spin>
            </a-tab-pane>
            <a-tab-pane key="edit" title="代码预览" class="wh-full">
              <Editor ref="editor" v-model:value="docHtml" />
            </a-tab-pane>
            <a-tab-pane v-if="response" key="render" title="结果预览" class="wh-full">
              <RenderMd :content="response" class="p-3 pt-0" />
            </a-tab-pane>
          </a-tabs>
        </div>
      </a-typography-paragraph>
    </template>
    <template #second>
      <a-typography-paragraph>
        <div class="wh-full relative">
          <IFrame :doc-html="docHtml" />
          <div v-show="docMask" class="absolute z-10 inset-0 "></div>
        </div>
      </a-typography-paragraph>
    </template>
  </a-split>
</template>

<script setup lang="ts">
import Ai from './Components/Ai.vue';
import Editor from './Components/Editor.vue';
import IFrame from './Components/IFrame.vue';
import RenderMd from './Components/RenderMd.vue';
import { computed, getCurrentInstance, onMounted, ref, useTemplateRef, watch } from 'vue';
import type { ChatOption } from "@/Interface"
import { Notification } from '@arco-design/web-vue';
import { useLocalStorage } from '@vueuse/core';
const tab = ref("ai")
const size = ref(0.5)
const editor = useTemplateRef("editor")
const docHtml = ref("")
const docMask = ref(false)
const isLoading = ref(false)
const response = ref(``)

useLocalStorage("response", response)

const vars = computed(() => ({
  html: docHtml.value
}))

watch(response, (contentResponse: string) => {
  if (!response.value.trim()) {
    tab.value = 'ai'
  }

  if (!editor.value) return
  const newHtml = contentResponse.match(/<!DOCTYPE html>[\s\S]*/)?.[0];
  if (!newHtml) return

  let partialDoc = newHtml;
  if (!partialDoc.includes("</html>")) {
    partialDoc += "\n</html>";
  } else {
    partialDoc = partialDoc.slice(0, partialDoc.indexOf("</html>") + "</html>".length)
  }

  setEditorValue(partialDoc)
})

const setEditorValue = (value: string) => {
  if (!editor.value) return
  editor.value.setValue(value)
}

const addEditorValue = (value: string) => {
  if (!editor.value) return
  editor.value.addValue(value)
}


const playNotificationSound = () => {
  const audioContext = new window.AudioContext()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()

  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime) // A4 note
  gainNode.gain.setValueAtTime(0, audioContext.currentTime)
  gainNode.gain.linearRampToValueAtTime(1, audioContext.currentTime + 0.01)
  gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.5)

  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
}

const sendRequest = async (option: ChatOption) => {
  let { url, token, model, messages, temperature, stream, max_token, renderMarkdown } = option
  url = url.trim()
  token = token.trim()
  model = model.trim()
  if (!url.endsWith("/v1/chat/completions")) {
    if (url.endsWith("/")) {
      url = url + "v1/chat/completions"
    } else {
      url = url + "/v1/chat/completions"
    }
  }

  if (!url || !token || !model || messages.length === 0) {
    Notification.error({ content: "请填写所有必填字段", showIcon: true })
    return;
  }
  isLoading.value = true;
  tab.value = "render"
  response.value = "加载中..."

  // 构建请求体
  const requestBody = { model, messages, temperature, stream, max_token };
  // console.log(requestBody);
  // return
  try {
    if (stream) {
      // 流式响应处理
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      })

      if (!result.ok) {
        console.log(result);

        Notification.error({ content: `HTTP error! Status: ${result.status}`, showIcon: true })
        response.value = ""
        return
      }

      if (!result || !result.body) {
        Notification.error({ content: "意外错误", showIcon: true })
        response.value = ""
        return
      }

      const reader = result.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      response.value = ""

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          // 处理 SSE 格式
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          for (const line of lines) {
            try {
              if (!line.trim() || line.indexOf("[DONE]") !== -1) break
              const data = JSON.parse(line.substring(6));
              if (data.choices && data.choices[0].delta && data.choices[0].delta.content) {
                const content = data.choices[0].delta.content;
                response.value += content
              }
            } catch (e) {
              console.error('解析 SSE 数据出错:', e);
            }
          }
        }
      } catch {

      } finally {
        reader.releaseLock();
      }
    } else {
      // 非流式响应处理
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(requestBody)
      })

      if (!result.ok) {
        Notification.error({ content: `HTTP error! Status: ${result.status}`, showIcon: true })
        response.value = ""
        return
      }

      if (!result) return
      const data = await result.json();
      if (data.choices && data.choices.length > 0) {
        response.value = data.choices[0].message.content
      } else {
        response.value = ""
        Notification.error({ content: "API返回的数据格式不正确", showIcon: true })
      }
    }
  } catch (error: any) {
    response.value = ""
    Notification.error({ content: response.value, showIcon: true })
  } finally {
    isLoading.value = false;
    playNotificationSound()
  }
}
</script>

<style>
.arco-split-pane {
  @apply h-full !overflow-hidden;
}

.arco-typography {
  @apply h-full overflow-hidden;
}

.arco-tabs-content {
  @apply flex-1 h-full;
}

.arco-tabs-content-list,
.arco-tabs-pane {
  @apply h-full;
}
</style>