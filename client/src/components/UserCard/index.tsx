import { User } from "@/state/api";
import Image from "next/image";
import React from "react";

type Props = {
    user: User;
};

const UserCard = ({ user }: Props) => {
    // Generate an initial for the avatar fallback
    const initial = user.username ? user.username.charAt(0).toUpperCase() : "?";

    return (
        <div className="flex items-center gap-4 rounded-xl border border-brand-600 bg-brand-200 p-5 shadow-sm transition-all hover:shadow-md">

            {/* Avatar Section */}
            <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-200 border border-brand-600">
                {user.profilePictureUrl ? (
                    <Image
                        src={`/${user.profilePictureUrl}`}
                        alt={`${user.username}'s profile`}
                        fill
                        className="rounded-full object-cover"
                        sizes="48px"
                    />
                ) : (
                    <span className="text-lg font-bold text-blue-600">
                        {initial}
                    </span>
                )}
            </div>

            {/* Typography Section */}
            <div className="min-w-0 flex-1">
                <h3 className="truncate text-base font-semibold text-brand-900">
                    {user.username}
                </h3>
                <p className="truncate text-sm text-brand-800">
                    {user.email}
                </p>
            </div>

        </div>
    );
};

export default UserCard;