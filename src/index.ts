import Vue from "vue";
import { v4 as uuidv4 } from "uuid";

// Simple logic for now.  A piece of content must have been continuously viewed
// for the visibilityTimeThreshold.
const DEFAULT_VISIBILITY_RATIO_THRESHOLD = 0.5;
const DEFAULT_VISIBILITY_TIME_THRESHOLD = 1000;

export type ImpressionSourceTypeString = "UNKNOWN_IMPRESSION_SOURCE_TYPE" | "DELIVERY" | "CLIENT_BACKEND";

export interface ImpressionSourceTypeMap {
  UNKNOWN_IMPRESSION_SOURCE_TYPE: 0;
  DELIVERY: 1;
  CLIENT_BACKEND: 2;
}

export interface Impression {
  userInfo?: {
    anonUserId?: string;
    userId?: string;
    isInternalUser?: boolean;
  };
  insertionId?: string;
  contentId?: string;
  impressionId: string;
  sourceType?: ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString;
  properties?: {
    struct: any;
  };
}

export default Vue.extend({
  data: function (): {
    /* The contentId to log on the impressionId. Defaults to undefined. */
    mixinContentId?: string;
    /* The (pre-impression) insertionId to log on the impressionId. Defauls to undefined. */
    mixinInsertionId?: string;
    /* A generated impression ID */
    mixinImpressionId: string;
    /* The IntersectionObserver instance */
    observer: IntersectionObserver | null;
    /* The visibility timer reference */
    timer: ReturnType<typeof setTimeout> | null;
    /* Whether we've logged an insertion for this piece of content */
    logged: boolean;
    /* Used to set the default source type.  Defaults to 'DELIVERY' = 1. */
    mixinDefaultSourceType?: ImpressionSourceTypeMap[keyof ImpressionSourceTypeMap] | ImpressionSourceTypeString;
  } {
    return {
      observer: null,
      mixinImpressionId: this.$props.impressionId || uuidv4(),
      mixinInsertionId: this.$props.insertionId || undefined,
      mixinContentId: this.$props.contentId,
      timer: null,
      logged: false,
      mixinDefaultSourceType: this.$props.defaultSourceType || 1,
    };
  },
  created: function () {
    console.log("impressionTracker.created()");
  },
  mounted: function () {
    console.log("impressionTracker.mounted()", this.mixinContentId, this.mixinImpressionId);
    const options = {
      root: null,
      margin: 0,
      threshold: DEFAULT_VISIBILITY_RATIO_THRESHOLD,
    };
    if (
      this.mixinContentId &&
      typeof window !== "undefined" &&
      typeof (window as any).IntersectionObserver !== "undefined"
    ) {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio >= DEFAULT_VISIBILITY_RATIO_THRESHOLD && !this.logged) {
          this.timer = setTimeout(this.logImpressionFunctor, DEFAULT_VISIBILITY_TIME_THRESHOLD);
        } else if (entries[0].intersectionRatio < DEFAULT_VISIBILITY_RATIO_THRESHOLD && !this.logged && this.timer) {
          clearTimeout(this.timer);
        }
      }, options);
      this.observer.observe(this.$el);
    }
  },
  deactivated: function () {
    console.log("impressionTracker.deactivated()");
  },
  destroyed: function () {
    console.log("impressionTracker.destroyed()");
    this.unload();
  },
  methods: {
    logImpressionFunctor() {
      console.log("logImpressionFunctor");
      this.logged = true;

      const impression: Impression = {
        impressionId: this.mixinImpressionId,
        sourceType: this.mixinDefaultSourceType,
      };

      if (this.mixinInsertionId) {
        impression.insertionId = this.mixinInsertionId;
      }
      console.log(this.mixinContentId, this.$props.contentId);
      if (this.mixinContentId != this.$props.contentId) {
        console.error("Content ID mismatch, not logging impression.");
        return;
      }
      if (this.mixinContentId) {
        impression.contentId = this.mixinContentId;
      }
      this.$props.logImpression && this.$props.logImpression(impression);
    },
    unload() {
      this?.observer?.unobserve(this.$el);
      this.timer && clearTimeout(this.timer);
    },
  },
});
