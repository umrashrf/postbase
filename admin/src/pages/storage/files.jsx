export default function Files({ user }) {
    return <div class="p-4">
        <h2 class="text-3xl">Files</h2>

        <div class="text-sm font-medium text-center text-body border-b border-default">
            <ul class="flex flex-wrap -mb-px" data-tabs-toggle="#default-styled-tab-content" data-tabs-active-classes="text-purple hover:text-purple border-purple" data-tabs-inactive-classes="dark:border-transparent text-body hover:text-fg-brand border-default hover:border-brand">
                <li class="me-2">
                    <a href="#" class="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand" aria-current="page">Data</a>
                </li>
                <li class="me-2">
                    <a href="#" class="inline-block p-4 text-fg-brand border-b border-brand rounded-t-base active">Rules</a>
                </li>
                <li class="me-2">
                    <a href="#" class="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Indexes</a>
                </li>
                <li class="me-2">
                    <a href="#" class="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Disaster Recovery</a>
                </li>
                <li>
                    <a class="inline-block p-4 text-fg-disabled rounded-t-base cursor-not-allowed dark:text-body">Usage</a>
                </li>
                <li>
                    <a class="inline-block p-4 text-fg-disabled rounded-t-base cursor-not-allowed dark:text-body">Query Insights</a>
                </li>
            </ul>
        </div>

    </div>;
}
