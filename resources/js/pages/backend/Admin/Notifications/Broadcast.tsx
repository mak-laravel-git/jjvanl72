import { Head, Link, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

import AdminLayout from '@/layouts/admin-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { index as notificationsIndex } from '@/routes/admin/notifications';
import { store } from '@/routes/admin/notifications/broadcast';

type TypeOption = {
    value: string;
    label: string;
};

type UserOption = {
    id: number;
    name: string;
    email: string;
};

type Props = {
    types: TypeOption[];
    roles: string[];
    users: UserOption[];
};

export default function NotificationBroadcast({ types, roles, users }: Props) {
    const form = useForm({
        title: '',
        body: '',
        type: types[0]?.value ?? 'broadcast',
        reference: '',
        roles: [] as string[],
        user_ids: [] as number[],
    });

    const toggleRole = (role: string) => {
        form.setData(
            'roles',
            form.data.roles.includes(role)
                ? form.data.roles.filter((item) => item !== role)
                : [...form.data.roles, role],
        );
    };

    const toggleUser = (userId: number) => {
        form.setData(
            'user_ids',
            form.data.user_ids.includes(userId)
                ? form.data.user_ids.filter((id) => id !== userId)
                : [...form.data.user_ids, userId],
        );
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(store.url());
    };

    return (
        <AdminLayout>
            <Head title="Broadcast notification" />

            <div className="p-6">
                <Link
                    href={notificationsIndex.url()}
                    className="text-[13.125px] font-semibold text-[#0260bd]"
                >
                    ← Back to notifications
                </Link>

                <div className="mt-5 max-w-3xl">
                    <h1 className="text-[22.5px] leading-[30px] font-bold text-[#050315]">
                        Broadcast notification
                    </h1>
                    <p className="mt-1 text-sm text-[#475569]">
                        Send an in-app notification to selected roles and/or
                        users.
                    </p>

                    <form
                        onSubmit={submit}
                        className="mt-6 space-y-5 rounded-[13.375px] border border-[#e2e8f0] bg-white p-6"
                    >
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                value={form.data.title}
                                onChange={(event) =>
                                    form.setData('title', event.target.value)
                                }
                                required
                            />
                            {form.errors.title ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.title}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="body">Message</Label>
                            <textarea
                                id="body"
                                value={form.data.body}
                                onChange={(event) =>
                                    form.setData('body', event.target.value)
                                }
                                required
                                rows={5}
                                className="border-input focus-visible:border-ring focus-visible:ring-ring/50 flex w-full rounded-md border bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-[3px]"
                            />
                            {form.errors.body ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.body}
                                </p>
                            ) : null}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Type</Label>
                                <Select
                                    value={form.data.type}
                                    onValueChange={(value) =>
                                        form.setData('type', value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {types.map((type) => (
                                            <SelectItem
                                                key={type.value}
                                                value={type.value}
                                            >
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {form.errors.type ? (
                                    <p className="text-sm text-red-600">
                                        {form.errors.type}
                                    </p>
                                ) : null}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="reference">Reference</Label>
                                <Input
                                    id="reference"
                                    value={form.data.reference}
                                    onChange={(event) =>
                                        form.setData(
                                            'reference',
                                            event.target.value,
                                        )
                                    }
                                    placeholder="Optional"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Roles</Label>
                            <div className="flex flex-wrap gap-2">
                                {roles.map((role) => {
                                    const selected =
                                        form.data.roles.includes(role);

                                    return (
                                        <button
                                            key={role}
                                            type="button"
                                            onClick={() => toggleRole(role)}
                                            className={cn(
                                                'rounded-full px-3 py-1.5 text-xs font-semibold',
                                                selected
                                                    ? 'bg-[#0260bd] text-white'
                                                    : 'bg-[#f1f5f9] text-[#475569]',
                                            )}
                                        >
                                            {role}
                                        </button>
                                    );
                                })}
                            </div>
                            {form.errors.roles ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.roles}
                                </p>
                            ) : null}
                        </div>

                        <div className="space-y-2">
                            <Label>Users</Label>
                            <div className="max-h-56 space-y-1 overflow-y-auto rounded-md border border-[#e2e8f0] p-2">
                                {users.map((user) => {
                                    const selected =
                                        form.data.user_ids.includes(user.id);

                                    return (
                                        <label
                                            key={user.id}
                                            className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selected}
                                                onChange={() =>
                                                    toggleUser(user.id)
                                                }
                                            />
                                            <span className="font-medium text-[#050315]">
                                                {user.name}
                                            </span>
                                            <span className="text-[#64748b]">
                                                {user.email}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                            {form.errors.user_ids ? (
                                <p className="text-sm text-red-600">
                                    {form.errors.user_ids}
                                </p>
                            ) : null}
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link
                                href={notificationsIndex.url()}
                                className="inline-flex items-center rounded-[9.375px] border border-[#e2e8f0] px-4 py-2 text-sm font-semibold text-[#475569]"
                            >
                                Cancel
                            </Link>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="bg-[#0260bd] hover:bg-[#024e9a]"
                            >
                                {form.processing ? 'Sending…' : 'Send broadcast'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
}
