<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $data['subject'] ?? 'Email' }}</title>
</head>
<body>
    <h1>{{ $data['subject'] ?? '' }}</h1>

    @isset($data['name'])
        <p>Hello, {{ $data['name'] }}</p>
    @endisset

    @isset($data['body'])
        <p>{{ $data['body'] }}</p>
    @endisset

    @isset($data['custom_field'])
        <p>Custom field: {{ $data['custom_field'] }}</p>
    @endisset
</body>
</html>
