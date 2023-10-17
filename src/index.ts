import Vue from "vue";

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
    /* Whether the impression tracker is active */
    active: boolean;
    /* The IntersectionObserver instance */
    observer: IntersectionObserver | null;
    /* The visibility timer reference */
    timer: ReturnType<typeof setTimeout> | null;
    /* Whether we've logged an insertion for this piece of content */
    logged: boolean;
  } {
    return {
      active: true,
      observer: null,
      timer: null,
      logged: false,
    };
  },

  props: {
    contentId: {
      type: String,
      default: undefined,
    },
    insertionId: {
      type: String,
      default: undefined,
    },
    impressionId: {
      type: String,
      default: undefined,
    },
    handleError: {
      type: Function,
      default: () => console.error,
    },
    defaultSourceType: {
      default: 1,
    },
    uuid: {
      type: Function,
      required: true,
    },
  },

  watch: {
    contentId: function (newContentId: string, oldContentId: string) {
      if (newContentId != oldContentId) {
        this.active = false;
        this.handleError(new Error("Detected contentId change, not supported."));
      }
    },
  },

  mounted: function () {
    const options = {
      root: null,
      margin: 0,
      threshold: DEFAULT_VISIBILITY_RATIO_THRESHOLD,
    };

    if (!this.$props.insertionId && !this.$props.contentId) {
      this.$props.handleError(new Error("insertionId or contentId should be set"));
      return;
    }

    if (
      this.$props.contentId &&
      typeof window !== "undefined" &&
      typeof (window as any).IntersectionObserver !== "undefined"
    ) {
      this.observer = new IntersectionObserver((entries) => {
        if (entries[0].intersectionRatio >= DEFAULT_VISIBILITY_RATIO_THRESHOLD && !this.logged) {
          this.timer = setTimeout(this.logImpressionFunctor, DEFAULT_VISIBILITY_TIME_THRESHOLD);
        } else if (entries[0].intersectionRatio < DEFAULT_VISIBILITY_RATIO_THRESHOLD && this.timer) {
          clearTimeout(this.timer);
          this.timer = null;
        }
      }, options);
      this.observer.observe(this.$el);
    }
  },
  destroyed: function () {
    this.unload();
  },
  methods: {
    logImpressionFunctor() {
      if (this.logged || !this.active) {
        return;
      }

      this.logged = true;

      const impression: Impression = {
        impressionId: this.impressionId || this.$props.uuid(),
        sourceType: this.$props.defaultSourceType,
      };

      if (this.$props.insertionId) {
        impression.insertionId = this.$props.insertionId;
      }

      if (!this.active) {
        this.$props.handleError(new Error("Impression Tracker deactivated, not logging."));
        return;
      }
      if (this.$props.contentId) {
        impression.contentId = this.$props.contentId;
      }
      this.$props.logImpression && this.$props.logImpression(impression);
    },
    unload() {
      this?.observer?.unobserve(this.$el);
      this.timer && clearTimeout(this.timer);
    },
  },
});
