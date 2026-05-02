import { useEffect, useState } from "preact/hooks";
import { authClient } from "../../auth";
import { formatDateTime } from "../../common/formatDateTime";

export default function Users({ user }) {
    const [users, setUsers] = useState(null);

    useEffect(() => {
        (async () => {
            const { data, error } = await authClient.admin.listUsers({
                query: {
                    limit: 100,
                    offset: 0,
                    sortBy: "createdAt",
                    sortDirection: "desc",
                },
            });
            setUsers(data.users);
        })();
    }, []);

    return <div class="p-4">
        <h2 class="text-3xl">Authentication</h2>

        <div class="text-sm font-medium text-center text-body border-b border-default">
            <ul class="flex flex-wrap -mb-px" data-tabs-toggle="#default-styled-tab-content" data-tabs-active-classes="text-purple hover:text-purple border-purple" data-tabs-inactive-classes="dark:border-transparent text-body hover:text-fg-brand border-default hover:border-brand">
                <li class="me-2">
                    <a href="#" class="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand" aria-current="page">Users</a>
                </li>
                <li class="me-2">
                    <a href="#" class="inline-block p-4 text-fg-brand border-b border-brand rounded-t-base active">Sign-in method</a>
                </li>
                <li class="me-2">
                    <a href="#" class="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Templates</a>
                </li>
                <li class="me-2">
                    <a href="#" class="inline-block p-4 border-b border-transparent rounded-t-base hover:text-fg-brand hover:border-brand">Usage</a>
                </li>
                <li>
                    <a class="inline-block p-4 text-fg-disabled rounded-t-base cursor-not-allowed dark:text-body">Settings</a>
                </li>
            </ul>
        </div>

        <div>
            {users && users.length > 0 &&
                <div class="relative overflow-x-auto bg-neutral-primary-soft shadow-xs rounded-base border border-default">
                    <div class="flex items-center justify-between flex-column md:flex-row flex-wrap space-y-4 md:space-y-0 p-4">
                        <div>
                            <button id="dropdownDefaultButton2" data-dropdown-toggle="dropdown-2" class="inline-flex items-center justify-center text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-3 py-2 focus:outline-none" type="button">
                                Action
                                <svg class="w-4 h-4 ms-1.5 -me-0.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 9-7 7-7-7" /></svg>
                            </button>
                            <div id="dropdown-2" class="z-10 hidden bg-neutral-primary-medium border border-default-medium rounded-base shadow-lg w-32">
                                <ul class="p-2 text-sm text-body font-medium" aria-labelledby="dropdownDefaultButton2">
                                    <li>
                                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Reward</a>
                                    </li>
                                    <li>
                                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Promote</a>
                                    </li>
                                    <li>
                                        <a href="#" class="inline-flex items-center w-full p-2 hover:bg-neutral-tertiary-medium hover:text-heading rounded">Archive</a>
                                    </li>
                                    <li>
                                        <a href="#" class="inline-flex items-center w-full p-2 text-fg-danger hover:bg-neutral-tertiary-medium rounded">Delete</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                        <label for="input-group-1" class="sr-only">Search</label>
                        <div class="relative">
                            <div class="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                                <svg class="w-4 h-4 text-body" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m21 21-3.5-3.5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" /></svg>
                            </div>
                            <input type="text" id="input-group-1" class="block w-full max-w-96 ps-9 pe-3 py-2 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand shadow-xs placeholder:text-body" placeholder="Search" />
                        </div>
                    </div>
                    <table class="w-full text-sm text-left rtl:text-right text-body">
                        <thead class="text-sm text-body bg-neutral-secondary-medium border-b border-t border-default-medium">
                            <tr>
                                <th scope="col" class="p-4">
                                    <div class="flex items-center">
                                        <input id="table-checkbox-51" type="checkbox" value="" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                        <label for="table-checkbox-51" class="sr-only">Table checkbox</label>
                                    </div>
                                </th>
                                <th scope="col" class="px-6 py-3 font-medium">
                                    Name
                                </th>
                                <th scope="col" class="px-6 py-3 font-medium">
                                    Providers
                                </th>
                                <th scope="col" class="px-6 py-3 font-medium">
                                    Created
                                </th>
                                <th scope="col" class="px-6 py-3 font-medium">
                                    Signed In
                                </th>
                                <th scope="col" class="px-6 py-3 font-medium">
                                    User UID
                                </th>
                                <th scope="col" class="px-6 py-3 font-medium">
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => <tr class="bg-neutral-primary-soft border-b border-default hover:bg-neutral-secondary-medium">
                                <td class="w-4 p-4">
                                    <div class="flex items-center">
                                        <input id="table-checkbox-52" type="checkbox" value="" class="w-4 h-4 border border-default-medium rounded-xs bg-neutral-secondary-medium focus:ring-2 focus:ring-brand-soft" />
                                        <label for="table-checkbox-52" class="sr-only">Table checkbox</label>
                                    </div>
                                </td>
                                <td scope="row" class="flex items-center px-6 py-4 text-heading whitespace-nowrap">
                                    <img class="w-10 h-10 rounded-full" src={u.image} alt="Jese image" />
                                    <div class="ps-3">
                                        <div class="text-base font-semibold">{u.name}</div>
                                        <div class="font-normal text-body">{u.email}</div>
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    {u.image.includes('googleusercontent.com') ? 'Google' : 'Email'}
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="h-2.5 w-2.5 rounded-full bg-success me-2"></div> {formatDateTime(u.createdAt)}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="h-2.5 w-2.5 rounded-full bg-success me-2"></div> {formatDateTime(u.updatedAt)}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <div class="flex items-center">
                                        <div class="h-2.5 w-2.5 rounded-full bg-success me-2"></div> {u.id}
                                    </div>
                                </td>
                                <td class="px-6 py-4">
                                    <a href="#" type="button" data-modal-target="editUserModal" data-modal-show="editUserModal" class="font-medium text-fg-brand hover:underline">Edit user</a>
                                </td>
                            </tr>)}
                        </tbody>
                    </table>

                    <div id="editUserModal" tabindex="-1" aria-hidden="true" class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
                        <div class="relative p-4 w-full max-w-md max-h-full">

                            <div class="relative bg-neutral-primary-soft border border-default rounded-base shadow-sm p-4 md:p-6">

                                <div class="flex items-center justify-between border-b border-default pb-4 md:pb-5">
                                    <h3 class="text-lg font-medium text-heading">
                                        Create new product
                                    </h3>
                                    <button type="button" class="text-body bg-transparent hover:bg-neutral-tertiary hover:text-heading rounded-base text-sm w-9 h-9 ms-auto inline-flex justify-center items-center" data-modal-hide="editUserModal">
                                        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18 17.94 6M18 18 6.06 6" /></svg>
                                        <span class="sr-only">Close modal</span>
                                    </button>
                                </div>

                                <form action="#">
                                    <div class="grid gap-4 grid-cols-2 py-4 md:py-6">
                                        <div class="col-span-2">
                                            <label for="name" class="block mb-2.5 text-sm font-medium text-heading">Name</label>
                                            <input type="text" name="name" id="name" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="Bonnie Green" required="" />
                                        </div>
                                        <div class="col-span-2 sm:col-span-1">
                                            <label for="position" class="block mb-2.5 text-sm font-medium text-heading">Position</label>
                                            <input type="text" name="position" id="position" class="bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full px-3 py-2.5 shadow-xs placeholder:text-body" placeholder="React Developer" required="" />
                                        </div>
                                        <div class="col-span-2 sm:col-span-1">
                                            <label for="category" class="block mb-2.5 text-sm font-medium text-heading">Status</label>
                                            <select id="category" class="block w-full px-3 py-2.5 bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand px-3 py-2.5 shadow-xs placeholder:text-body">
                                                <option selected="">Online</option>
                                                <option value="offline">Offline</option>
                                                <option value="archived">Archived</option>
                                            </select>
                                        </div>
                                        <div class="col-span-2">
                                            <label for="biography" class="block mb-2.5 text-sm font-medium text-heading">Biography</label>
                                            <textarea id="biography" rows="4" class="block bg-neutral-secondary-medium border border-default-medium text-heading text-sm rounded-base focus:ring-brand focus:border-brand block w-full p-3.5 shadow-xs placeholder:text-body" placeholder="Write a short biography here"></textarea>
                                        </div>
                                    </div>
                                    <div class="flex items-center space-x-4 border-t border-default pt-4 md:pt-6">
                                        <button type="submit" class="inline-flex items-center  text-white bg-brand hover:bg-brand-strong box-border border border-transparent focus:ring-4 focus:ring-brand-medium shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">
                                            Update user
                                        </button>
                                        <button data-modal-hide="crud-modal" type="button" class="text-body bg-neutral-secondary-medium box-border border border-default-medium hover:bg-neutral-tertiary-medium hover:text-heading focus:ring-4 focus:ring-neutral-tertiary shadow-xs font-medium leading-5 rounded-base text-sm px-4 py-2.5 focus:outline-none">Cancel</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            }
        </div>
    </div>;
}
