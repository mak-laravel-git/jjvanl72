<?php

it('redirects guests from home to the login page', function () {
    $this->get('/')->assertRedirect(route('login'));
});
