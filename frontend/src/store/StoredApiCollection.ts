import ManagedApi from "../managedApi/ManagedApi";
import apiCollection from "../managedApi/apiCollection";
import NoteEditingHistory from "./NoteEditingHistory";
import NoteStorage from "./NoteStorage";

export interface StoredApi {
  getNoteRealmWithPosition(
    noteId: Doughnut.ID
  ): Promise<Generated.NoteRealmWithPosition>;

  createNote(
    parentId: Doughnut.ID,
    data: Generated.NoteCreation
  ): Promise<Generated.NoteRealm>;

  createLink(
    sourceId: Doughnut.ID,
    targetId: Doughnut.ID,
    data: Generated.LinkCreation
  ): Promise<Generated.NoteRealm>;

  updateLink(
    linkId: Doughnut.ID,
    data: Generated.LinkCreation
  ): Promise<Generated.NoteRealm>;

  deleteLink(
    linkId: Doughnut.ID,
    fromTargetPerspective: boolean
  ): Promise<Generated.NoteRealm>;

  updateNote(
    noteId: Doughnut.ID,
    noteContentData: Generated.NoteAccessories
  ): Promise<Generated.NoteRealm>;

  updateTextContent(
    noteId: Doughnut.ID,
    noteContentData: Generated.TextContent,
    oldContent: Generated.TextContent
  ): Promise<Generated.NoteRealm>;

  updateWikidataId(
    noteId: Doughnut.ID,
    data: Generated.WikidataAssociationCreation
  ): Promise<Generated.NoteRealm>;

  undo(): Promise<Generated.NoteRealm>;

  deleteNote(noteId: Doughnut.ID): Promise<Generated.NoteRealm | undefined>;
}
export default class StoredApiCollection implements StoredApi {
  noteEditingHistory: NoteEditingHistory;

  managedApi: ManagedApi;

  storage: NoteStorage;

  constructor(undoHistory: NoteEditingHistory, storage: NoteStorage) {
    this.managedApi = new ManagedApi();
    this.noteEditingHistory = undoHistory;
    this.storage = storage;
  }

  private get statelessApi(): ReturnType<typeof apiCollection> {
    return apiCollection(this.managedApi);
  }

  private async updateTextContentWithoutUndo(
    noteId: Doughnut.ID,
    noteContentData: Generated.TextContent
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...data } = noteContentData;
    return (await this.managedApi.restPatchMultiplePartForm(
      `text_content/${noteId}`,
      data
    )) as Generated.NoteRealm;
  }

  async updateWikidataId(
    noteId: Doughnut.ID,
    data: Generated.WikidataAssociationCreation
  ): Promise<Generated.NoteRealm> {
    return this.storage.refreshNoteRealm(
      await this.statelessApi.wikidata.updateWikidataId(noteId, data)
    );
  }

  async getNoteRealmWithPosition(noteId: Doughnut.ID) {
    const nrwp = await this.statelessApi.noteMethods.getNoteRealmWithPosition(
      noteId
    );
    this.storage.refreshNoteRealm(nrwp);
    return nrwp;
  }

  async createNote(parentId: Doughnut.ID, data: Generated.NoteCreation) {
    return this.storage.refreshNoteRealm(
      (await this.managedApi.restPostMultiplePartForm(
        `notes/${parentId}/create`,
        data
      )) as Generated.NoteRealmWithPosition
    );
  }

  async createLink(
    sourceId: Doughnut.ID,
    targetId: Doughnut.ID,
    data: Generated.LinkCreation
  ) {
    return this.storage.refreshNoteRealm(
      (await this.managedApi.restPost(
        `links/create/${sourceId}/${targetId}`,
        data
      )) as Generated.NoteRealm
    );
  }

  async updateLink(linkId: Doughnut.ID, data: Generated.LinkCreation) {
    return this.storage.refreshNoteRealm(
      (await this.managedApi.restPost(
        `links/${linkId}`,
        data
      )) as Generated.NoteRealm
    );
  }

  async deleteLink(linkId: Doughnut.ID, fromTargetPerspective: boolean) {
    return this.storage.refreshNoteRealm(
      (await this.managedApi.restPost(
        `links/${linkId}/${fromTargetPerspective ? "tview" : "sview"}/delete`,
        {}
      )) as Generated.NoteRealm
    );
  }

  async updateNote(
    noteId: Doughnut.ID,
    noteContentData: Generated.NoteAccessories
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { updatedAt, ...data } = noteContentData;
    return this.storage.refreshNoteRealm(
      (await this.managedApi.restPatchMultiplePartForm(
        `notes/${noteId}`,
        data
      )) as Generated.NoteRealm
    );
  }

  async updateTextContent(
    noteId: Doughnut.ID,
    noteContentData: Generated.TextContent,
    oldContent: Generated.TextContent
  ) {
    this.noteEditingHistory.addEditingToUndoHistory(noteId, oldContent);
    return this.storage.refreshNoteRealm(
      await this.updateTextContentWithoutUndo(noteId, noteContentData)
    );
  }

  private async undoInner() {
    const undone = this.noteEditingHistory.peekUndo();
    if (!undone) throw new Error("undo history is empty");
    this.noteEditingHistory.popUndoHistory();
    if (undone.type === "editing" && undone.textContent) {
      return this.updateTextContentWithoutUndo(
        undone.noteId,
        undone.textContent
      );
    }
    return (await this.managedApi.restPatch(
      `notes/${undone.noteId}/undo-delete`,
      {}
    )) as Generated.NoteRealm;
  }

  async undo() {
    return this.storage.refreshNoteRealm(await this.undoInner());
  }

  async deleteNote(noteId: Doughnut.ID) {
    const res = (await this.managedApi.restPost(
      `notes/${noteId}/delete`,
      {}
    )) as Generated.NoteRealm[];
    this.noteEditingHistory.deleteNote(noteId);
    if (res.length === 0) {
      this.storage.focusOnNotebooks();
      return undefined;
    }
    return this.storage.refreshNoteRealm(res[0]);
  }
}
