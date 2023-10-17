# vue-impression-tracker

This library is used to track impressions using a Vue mixin. It currently support Vue 2 applications.

## Mixin

<script setup lang="ts">
defineProps({
  logImpression: {
    type: Function,
    required: true,
  },
  contentId: {
    type: String,
    required: true,
  },
});
</script>

<template>
  <div>Your Content</div>
</template>

<script lang="ts">
import impressionTracker from "vue-impression-tracker";
export default {
  mixins: [impressionTracker],
};
</script>

### Local Development

Run the watcher with: `yarn build:watch`.

Symlink the built module if you haven't yet.

```
cd dist
yarn link
```

Run unit tests with `yarn test` or link the built module to a test app.

```
yarn link vue-impression-tracker
```
