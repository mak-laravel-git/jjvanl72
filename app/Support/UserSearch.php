<?php

namespace App\Support;

use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

final class UserSearch
{
    /**
     * Constrain a User query to Scout search hits for the given term.
     *
     * @param  Builder<User>  $query
     * @return Builder<User>
     */
    public static function constrain(Builder $query, string $search): Builder
    {
        $search = trim($search);

        if ($search === '') {
            return $query;
        }

        $ids = User::search($search)->take(1000)->keys();

        if ($ids->isEmpty()) {
            return $query->whereRaw('0 = 1');
        }

        return $query->whereIn($query->getModel()->getQualifiedKeyName(), $ids->all());
    }
}
