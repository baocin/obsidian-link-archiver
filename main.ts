import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import fetch from "node-fetch";

interface MyPluginSettings {
	autoArchiveOnDocumentLoad: boolean;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	autoArchiveOnDocumentLoad: false
}

export default class MyPlugin extends Plugin {
	settings: MyPluginSettings;
	
	async onload() {
		console.log("Loading Link Archiver");
		await this.loadSettings();

		// this.addRibbonIcon('dice', 'Sample Plugin', () => {
		// 	new Notice('This is a notice!');
		// });

		this.addCommand({
			id: 'auto-link-archiver-save-open-page',
			name: 'Archive all links on current page',
			checkCallback: (checking: boolean) => {
				let leaf = this.app.workspace.activeLeaf;
				if (leaf) {
					if (!checking) {
						new SampleModal(this.app, this.cm).open();
					}
					return true;
				}
				return false;
			}
		});

		// this.addSettingTab(new SampleSettingTab(this.app, this));

		this.registerCodeMirror((cm: CodeMirror.Editor) => {
			console.log('codemirror', cm);
			this.cm = cm;
			
			cm.on("cursorActivity", (cm: CodeMirror.Editor) => {
				const current = cm.getCursor().line + 1;
				if (cm.state.curLineNum === current) {
					return;
				}
				// console.log(current);
				// console.log("doc", cm.getDoc().getValue());
			});

			this.registerEvent(
				this.app.metadataCache.on("changed", (file) => {
					// file saves, etc.
					console.log('metadata cache changed', file);
				})
			  );
		});

		// const a = document.getElementsByClassName("CodeMirror");
		// console.log("a", a);		
	}

	onunload() {
		console.log('unloading Link Archiver plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class SampleModal extends Modal {
	constructor(app: App, cm: CodeMirror.Editor) {
		super(app);
		this.cm = cm;
		this.modalContent = "";
	}

	onOpen() {
		let {contentEl} = this;
		let urlStatuses = [];

		const currentNoteContents = this.cm.getDoc().getValue();
		const regex = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:\/~+#-]*[\w@?^=%&\/~+#-])?/g
		const urlMatches = currentNoteContents.match(regex) || [];
		const matchCount = urlMatches.length;
		if (matchCount === 0){
			return;
		}
		const header = (index) => `<h1>Link Archiving Status (${index}/${matchCount})</h1>`
		let i = 0;
		contentEl.innerHTML = header(i);

		urlMatches.forEach(async (url) => {
			const result = await fetch(`https://web.archive.org/save/${url}`)
			const status = {
				sourceUrl: url,
				url: result.url,
				status: result.status,
				ok: result.ok
			}
			urlStatuses.push(status);
			contentEl.innerHTML = `
				${header(++i)}
				<ul>
					${urlStatuses.map(result => `<li>${result.ok ? '✓' :  '✖' } <a href="${result.sourceUrl}">${result.sourceUrl}</a> => <a href="${result.url}">${result.url}</a></li>`).join('')}
				</ul>
			`
		});
	}

	onClose() {
		let {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: MyPlugin;

	constructor(app: App, plugin: MyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		let {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for Link Archiver'});

		containerEl.createEl('h4', {text: 'Currently None :)'});

		// new Setting(containerEl)
		// 	.setName('Auto Archive on document open')
		// 	.setDesc('Auto archive links anytime you open a document. We\'d rather not overload our friends at archive.org (They run the WaybackMachine).')
		// 	.addToggle(toggle => toggle
		// 		.onChange(async (value) => {
		// 			console.log('Secret: ' + value);
		// 			this.plugin.settings.autoArchiveOnDocumentLoad = value;
		// 			await this.plugin.saveSettings();
		// 		}));
	}
}
