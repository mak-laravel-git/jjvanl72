<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $data['subject'] ?? 'Confirm your current email' }}</title>
</head>
<body>
    <h1>{{ $data['subject'] ?? 'Confirm your current email' }}</h1>

    @isset($data['name'])
        <p>Hello, {{ $data['name'] }},</p>
    @endisset

    <p>We received a request to change the email address on your account. Enter this code to confirm you still control your current email:</p>

    <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">{{ $data['code'] ?? '' }}</p>

    <p>This code expires in 15 minutes. If you did not request this change, you can ignore this email.</p>
</body>
</html>
