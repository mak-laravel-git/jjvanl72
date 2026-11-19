<?php

namespace App\Data;

use App\Enums\NotificationType;

class NotificationPayload
{
    /**
     * @param  array<string, mixed>|null  $data
     */
    public function __construct(
        public string $title,
        public string $body,
        public NotificationType $type = NotificationType::System,
        public ?string $reference = null,
        public ?string $icon = null,
        public ?string $icon_bg = null,
        public ?array $data = null,
        public ?string $action_url = null,
    ) {}

    /**
     * @param  array{
     *     title: string,
     *     body: string,
     *     type?: NotificationType|string,
     *     reference?: string|null,
     *     icon?: string|null,
     *     icon_bg?: string|null,
     *     data?: array<string, mixed>|null,
     *     action_url?: string|null
     * }  $attributes
     */
    public static function from(array $attributes): self
    {
        $type = $attributes['type'] ?? NotificationType::System;

        if (is_string($type)) {
            $type = NotificationType::from($type);
        }

        return new self(
            title: $attributes['title'],
            body: $attributes['body'],
            type: $type,
            reference: $attributes['reference'] ?? null,
            icon: $attributes['icon'] ?? null,
            icon_bg: $attributes['icon_bg'] ?? null,
            data: $attributes['data'] ?? null,
            action_url: $attributes['action_url'] ?? null,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'type' => $this->type,
            'title' => $this->title,
            'body' => $this->body,
            'reference' => $this->reference,
            'icon' => $this->icon ?? $this->type->defaultIcon(),
            'icon_bg' => $this->icon_bg ?? $this->type->defaultIconBg(),
            'data' => $this->data,
            'action_url' => $this->action_url,
        ];
    }
}
