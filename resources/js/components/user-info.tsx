import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useInitials } from '@/hooks/use-initials';
import { type User } from '@/types';

interface UserInfoProps {
    user: User;
    showEmail?: boolean;
    showName?: boolean;
}

export function UserInfo({
    user,
    showEmail = false,
    showName = false,
}: UserInfoProps) {
    const getInitials = useInitials();
    return (
        <>
            <Avatar className="h-12 w-12 overflow-hidden rounded-full">
                <AvatarImage
                    src={user.avatar_url || user.avatar}
                    alt={user.name}
                />
                <AvatarFallback className="rounded-lg bg-primary font-montserrat text-lg font-semibold text-white">
                    {getInitials(user.name)}
                </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight">
                {showName && (
                    <span className="text-text-secondary truncate font-montserrat text-base font-semibold">
                        {user.name}
                    </span>
                )}
                {showEmail && (
                    <span className="text-text-primary truncate text-base">
                        {user.email}
                    </span>
                )}
            </div>
        </>
    );
}
