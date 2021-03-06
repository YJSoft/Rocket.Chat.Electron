(function() {
    var key = 'rocket.chat.host',
        header = 'X-Rocket-Chat-Version'.toLowerCase();

    //init loader
    var loader = document.querySelector('.loader');
    if (loader) {
        var src = loader.getAttribute('data-src');
        var http = new XMLHttpRequest();
        http.open('GET', src);
        http.onreadystatechange = function() {
            if (this.readyState == this.DONE) {
                if (this.response) {
                    loader.innerHTML = this.response + loader.innerHTML;
                }
            }
        };
        http.send();
    }

    var url = localStorage.getItem(key);
    console.debug(url);
    if (url) {
        document.body.classList.add('connecting');
        // redirect to host
        redirect(url);
        return;
    }

    // connection check
    if (!navigator.onLine) offline();
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);

    function online() {
        document.body.classList.remove('offline');
    }

    function offline() {
        document.body.classList.add('offline');
    }
    // end connection check

    var form = document.querySelector('form');
    form.addEventListener('submit', function(ev) {
        ev.preventDefault();
        ev.stopPropagation();
        var input = form.querySelector('[name="host"]');
        var button = form.querySelector('[type="submit"]');
        var val = button.value;
        button.value = button.getAttribute('data-loading-text');
        var url = input.value;
        console.debug('checking', url);
        input.classList.remove('wrong');
        urlExists(url, 5000).then(function() {
            console.debug('url found!');
            localStorage.setItem(key, url);
            document.body.classList.add('connecting');
            // redirect to host
            redirect(url);
        }, function(status) {
            button.value = val;
            console.debug('url wrong');
            input.classList.add('wrong');
        });
        return false;
    });

    function urlExists(url, timeout) {
        return new Promise(function(resolve, reject) {
            var http = new XMLHttpRequest();
            var resolved = false;
            http.open('HEAD', url);
            http.onreadystatechange = function() {
                if (this.readyState == this.DONE) {
                    if (!resolved) {
                        resolved = true;
                        var headers = this.getAllResponseHeaders().toLowerCase();
                        if (headers.indexOf(header) !== -1) {
                            resolve();
                        } else {
                            reject(this.status);
                        }
                    }
                }
            };
            if (timeout) {
                setTimeout(function() {
                    if (!resolved) {
                        resolved = true;
                        reject();
                    }
                }, timeout);
            }
            http.send();
        });
    }

    function redirect(url) {
        window.open(url, '_blank');
    }

})();
