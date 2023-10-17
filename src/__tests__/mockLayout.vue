<script setup lang="ts">
defineProps({
  logImpression: {
    type: Function,
    required: true,
  },
  impressionId: {
    type: String,
    required: true,
  },
  insertionId: {
    type: String,
  },
  contentId: {
    type: String,
    required: true,
  },
  uuid: {
    type: Function,
    required: true,
  },
});
</script>

<template>
  <div>Hello World</div>
</template>

<script lang="ts">
import impressionTracker from "../../src/index";
export default {
  mixins: [impressionTracker],
};
</script>
