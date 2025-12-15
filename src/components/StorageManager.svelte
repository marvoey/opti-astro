<script lang="ts">
	import { onMount } from 'svelte';

	interface StorageItem {
		key: string;
		value: string;
		editing?: boolean;
	}

	let isOpen = $state(false);
	let activeTab = $state<'cookies' | 'session' | 'local'>('cookies');
	let cookieItems = $state<StorageItem[]>([]);
	let sessionItems = $state<StorageItem[]>([]);
	let localItems = $state<StorageItem[]>([]);
	let newKey = $state('');
	let newValue = $state('');

	// Parse cookies into key-value pairs
	function parseCookies(): StorageItem[] {
		return document.cookie
			.split(';')
			.filter((c) => c.trim())
			.map((cookie) => {
				const [key, ...valueParts] = cookie.trim().split('=');
				return {
					key: key.trim(),
					value: valueParts.join('=').trim(),
					editing: false,
				};
			});
	}

	// Parse storage (localStorage or sessionStorage)
	function parseStorage(storage: Storage): StorageItem[] {
		const items: StorageItem[] = [];
		for (let i = 0; i < storage.length; i++) {
			const key = storage.key(i);
			if (key) {
				items.push({
					key,
					value: storage.getItem(key) || '',
					editing: false,
				});
			}
		}
		return items.sort((a, b) => a.key.localeCompare(b.key));
	}

	// Refresh data
	function refreshData() {
		cookieItems = parseCookies();
		sessionItems = parseStorage(sessionStorage);
		localItems = parseStorage(localStorage);
	}

	// Delete cookie
	function deleteCookie(key: string) {
		document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
		refreshData();
	}

	// Update cookie
	function updateCookie(key: string, newValue: string) {
		document.cookie = `${key}=${newValue}; path=/;`;
		refreshData();
	}

	// Delete from storage
	function deleteFromStorage(storage: Storage, key: string) {
		storage.removeItem(key);
		refreshData();
	}

	// Update storage
	function updateStorage(storage: Storage, key: string, newValue: string) {
		storage.setItem(key, newValue);
		refreshData();
	}

	// Add new item
	function addItem() {
		if (!newKey.trim()) return;

		if (activeTab === 'cookies') {
			document.cookie = `${newKey}=${newValue}; path=/;`;
		} else if (activeTab === 'session') {
			sessionStorage.setItem(newKey, newValue);
		} else if (activeTab === 'local') {
			localStorage.setItem(newKey, newValue);
		}

		newKey = '';
		newValue = '';
		refreshData();
	}

	// Toggle edit mode
	function toggleEdit(item: StorageItem) {
		item.editing = !item.editing;
	}

	// Save edit
	function saveEdit(item: StorageItem, newValue: string) {
		if (activeTab === 'cookies') {
			updateCookie(item.key, newValue);
		} else if (activeTab === 'session') {
			updateStorage(sessionStorage, item.key, newValue);
		} else if (activeTab === 'local') {
			updateStorage(localStorage, item.key, newValue);
		}
		item.editing = false;
		refreshData();
	}

	// Clear all
	function clearAll() {
		if (!confirm('Are you sure you want to clear all items?')) return;

		if (activeTab === 'cookies') {
			cookieItems.forEach((item) => deleteCookie(item.key));
		} else if (activeTab === 'session') {
			sessionStorage.clear();
		} else if (activeTab === 'local') {
			localStorage.clear();
		}
		refreshData();
	}

	// Get current items based on active tab
	function getCurrentItems(): StorageItem[] {
		if (activeTab === 'cookies') return cookieItems;
		if (activeTab === 'session') return sessionItems;
		return localItems;
	}

	// Export as JSON
	function exportAsJSON() {
		const items = getCurrentItems();
		const data = items.reduce(
			(acc, item) => {
				acc[item.key] = item.value;
				return acc;
			},
			{} as Record<string, string>,
		);
		const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `${activeTab}-storage.json`;
		a.click();
		URL.revokeObjectURL(url);
	}

	onMount(() => {
		refreshData();
	});

	$effect(() => {
		if (isOpen) {
			refreshData();
		}
	});
</script>

<!-- Floating Action Button -->
<button
	class="btn btn-circle btn-primary fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl transition-all"
	onclick={() => (isOpen = true)}
	aria-label="Open Storage Manager"
>
	<svg
		xmlns="http://www.w3.org/2000/svg"
		fill="none"
		viewBox="0 0 24 24"
		stroke-width="1.5"
		stroke="currentColor"
		class="w-6 h-6"
	>
		<path
			stroke-linecap="round"
			stroke-linejoin="round"
			d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
		/>
	</svg>
</button>

<!-- Drawer -->
{#if isOpen}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 bg-black/50 z-[60] transition-opacity"
		onclick={() => (isOpen = false)}
	></div>

	<!-- Drawer Panel -->
	<div class="fixed top-0 right-0 h-full w-full max-w-2xl bg-base-100 z-[70] shadow-2xl overflow-hidden flex flex-col">
		<!-- Header -->
		<div class="flex items-center justify-between p-4 border-b border-base-300">
			<h2 class="text-xl font-bold">Storage Manager</h2>
			<button class="btn btn-sm btn-circle btn-ghost" onclick={() => (isOpen = false)}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-5 h-5"
				>
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
				</svg>
			</button>
		</div>

		<!-- Tabs -->
		<div role="tablist" class="tabs tabs-bordered px-4 pt-2">
			<button
				role="tab"
				class="tab"
				class:tab-active={activeTab === 'cookies'}
				onclick={() => (activeTab = 'cookies')}
			>
				Cookies ({cookieItems.length})
			</button>
			<button
				role="tab"
				class="tab"
				class:tab-active={activeTab === 'session'}
				onclick={() => (activeTab = 'session')}
			>
				Session Storage ({sessionItems.length})
			</button>
			<button
				role="tab"
				class="tab"
				class:tab-active={activeTab === 'local'}
				onclick={() => (activeTab = 'local')}
			>
				Local Storage ({localItems.length})
			</button>
		</div>

		<!-- Actions Bar -->
		<div class="flex gap-2 p-4 border-b border-base-300">
			<button class="btn btn-sm btn-outline" onclick={refreshData}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-4 h-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"
					/>
				</svg>
				Refresh
			</button>
			<button class="btn btn-sm btn-outline" onclick={exportAsJSON}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-4 h-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
					/>
				</svg>
				Export JSON
			</button>
			<button class="btn btn-sm btn-error btn-outline ml-auto" onclick={clearAll}>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="w-4 h-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
					/>
				</svg>
				Clear All
			</button>
		</div>

		<!-- Add New Item Form -->
		<div class="p-4 bg-base-200 border-b border-base-300">
			<h3 class="text-sm font-semibold mb-2">Add New Item</h3>
			<div class="flex gap-2">
				<input
					type="text"
					placeholder="Key"
					class="input input-sm input-bordered flex-1"
					bind:value={newKey}
				/>
				<input
					type="text"
					placeholder="Value"
					class="input input-sm input-bordered flex-1"
					bind:value={newValue}
				/>
				<button class="btn btn-sm btn-primary" onclick={addItem} disabled={!newKey.trim()}>
					Add
				</button>
			</div>
		</div>

		<!-- Content -->
		<div class="flex-1 overflow-y-auto p-4">
			{#if getCurrentItems().length === 0}
				<div class="text-center text-base-content/60 py-8">
					<p>No items found</p>
				</div>
			{:else}
				<div class="space-y-2">
					{#each getCurrentItems() as item (item.key)}
						<div class="card bg-base-200 shadow-sm">
							<div class="card-body p-4">
								<div class="flex items-start gap-2">
									<div class="flex-1">
										<div class="font-mono text-sm font-semibold text-primary break-all">
											{item.key}
										</div>
										{#if item.editing}
											<input
												type="text"
												class="input input-sm input-bordered w-full mt-2 font-mono"
												value={item.value}
												onblur={(e) => saveEdit(item, e.currentTarget.value)}
												onkeydown={(e) => {
													if (e.key === 'Enter') {
														saveEdit(item, e.currentTarget.value);
													} else if (e.key === 'Escape') {
														item.editing = false;
													}
												}}
												autofocus
											/>
										{:else}
											<div class="text-sm mt-2 font-mono break-all text-base-content/80">
												{item.value || '(empty)'}
											</div>
										{/if}
									</div>
									<div class="flex gap-1">
										<button
											class="btn btn-xs btn-ghost"
											onclick={() => toggleEdit(item)}
											title="Edit"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="w-4 h-4"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
												/>
											</svg>
										</button>
										<button
											class="btn btn-xs btn-ghost text-error"
											onclick={() => {
												if (activeTab === 'cookies') {
													deleteCookie(item.key);
												} else if (activeTab === 'session') {
													deleteFromStorage(sessionStorage, item.key);
												} else {
													deleteFromStorage(localStorage, item.key);
												}
											}}
											title="Delete"
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												fill="none"
												viewBox="0 0 24 24"
												stroke-width="1.5"
												stroke="currentColor"
												class="w-4 h-4"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
												/>
											</svg>
										</button>
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>
{/if}
