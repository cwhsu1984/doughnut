<template>
  <button title="Delete note" @click="deleteNote">
    <SvgRemove />Delete note
  </button>
</template>

<script lang="ts">
import { defineComponent, PropType } from "vue";
import SvgRemove from "../svgs/SvgRemove.vue";
import usePopups from "../commons/Popups/usePopup";
import { StorageAccessor } from "../../store/createNoteStorage";

export default defineComponent({
  setup() {
    return {
      ...usePopups(),
    };
  },
  props: {
    noteId: { type: Number, required: true },
    storageAccessor: {
      type: Object as PropType<StorageAccessor>,
      required: true,
    },
  },
  components: {
    SvgRemove,
  },
  methods: {
    async deleteNote() {
      if (await this.popups.confirm(`Confirm to delete this note?`)) {
        await this.storageAccessor.api().deleteNote(this.noteId);
      }
    },
  },
});
</script>
