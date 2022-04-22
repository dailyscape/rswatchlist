const storage = window.localStorage;
var combinedData = [];

const combineSortData = function() {
    //combine
    for (let itemid in rsapidata) {
        if (itemid in rselydata && rselydata[itemid].elyprices.length > 0) {
            let totalprice=0
            for (let price of rselydata[itemid].elyprices) {
                totalprice+=price.price
            }
            rselydata[itemid].elyavgprice = totalprice / rselydata[itemid].elyprices.length;
        }

        let isFav = storage.getItem('fav-' + itemid) ?? 'false';

        combinedData.push(Object.assign({"id": itemid, "fav": isFav}, rsapidata[itemid], rselydata[itemid]));
    }

    //default sort - uses ely price or ge price
    //@todo maybe account for old ely data too?
    combinedData.sort((a, b) => {
        if (a.fav == 'true' && b.fav == 'false') {
            return -1;
        } else if (b.fav == 'true' && a.fav == 'false') {
            return 1;
        }

        let sortPriceA = (a.price > 0 && "elyavgprice" in a && a.elyavgprice > 0) ? a.elyavgprice : a.price;
        let sortPriceB = (b.price > 0 && "elyavgprice" in b && b.elyavgprice > 0) ? b.elyavgprice : b.price;
        let sortSolution = sortPriceB - sortPriceA;

        return sortSolution;
    });
}

const getItems = function() {
    const lazyloadAfter = 30;
    const sampleRow = document.querySelector('#sample_row');
    const table = document.getElementById('item_table');
    const tbody = table.querySelector('tbody');
    let lazyloadCount = 0;
    for (let item of combinedData) {
        let itemid = item.id;

        if ('price' in item || ('elyprices' in item && item.elyprices.length > 0)) {
            let rowClone = sampleRow.content.cloneNode(true);
            let newRow = rowClone.querySelector('tr');

            let isFav = storage.getItem('fav-' + itemid) ?? 'false';
            if (isFav !== 'false') {
                newRow.dataset.fav = 'true';
            }

            newRow.dataset.id = itemid;

            let wikinamelink = item.name.toLowerCase().replace(/\s+/g, '_');
            wikinamelink = wikinamelink.charAt(0).toUpperCase() + wikinamelink.slice(1);
            wikiLink = '<a href="https://runescape.wiki/w/' + wikinamelink + '" target="_blank" rel=\"noreferrer noopener\">';
            let elyLink = ('elyname' in item) ? '<a href="https://www.ely.gg/search?search_item=' + item.elyname + '" target="_blank" rel=\"noreferrer noopener\">' : '';
            let lazyloadHtml = (lazyloadCount > lazyloadAfter) ? ' loading="lazy"' : 'loading="eager"';

            newRow.children[1].innerHTML = wikiLink + '<img class="item_icon" src="/rsdata/images/' + itemid + '.gif" ' + lazyloadHtml +'></a> ' + elyLink + item.name + '</a>';

            newRow.children[2].dataset.value = item.price;
            newRow.children[2].innerHTML = item.price.toLocaleString() + '<span class="coin">●</span>';

            if (itemid in rselydata && item.elyprices.length == 1 ) {
                let dateThreshold=new Date();
                dateThreshold.setMonth(dateThreshold.getMonth() - 2);
                let dateTraded=new Date(item.elyprices[0].date);
                let oldishPirce = item.elyprices[0].price;
                newRow.children[3].dataset.value = oldishPirce;
                if (dateTraded <= dateThreshold) {
                    newRow.children[3].innerHTML = '<span class="oldish-price" title="Last Entry: ' + item.elyprices[0].date + '">' + parseInt(oldishPirce).toLocaleString() + '<span class="oldman">👴</span></span>';
                } else {
                    newRow.children[3].innerHTML = '<span title="Last Entry: ' + item.elyprices[0].date + '">' + parseInt(oldishPirce).toLocaleString() + '<span class="coin">●</span></span>';
                }
            } else if (itemid in rselydata && item.elyprices.length > 0) {
                totalprice=0
                for (let price of item.elyprices) {
                    totalprice+=price.price
                }
                let avgprice=totalprice / item.elyprices.length;
                newRow.children[3].dataset.value = avgprice;
                newRow.children[3].innerHTML = '<span title="Last Entry: ' + item.elyprices[0].date + '">' + parseInt(avgprice).toLocaleString() + '<span class="coin">●</span></span>';
            } else {
                newRow.children[3].dataset.value = 0;
            }
            tbody.appendChild(newRow);
            lazyloadCount++;
        } else {
            console.log("Item ID: " + itemid + " " + item.elyname + " no price data found");
        }
    }
}

const makeSortable = function() {
    const table = document.getElementById('item_table');
    const ths = table.querySelectorAll('th');
    const tbody = table.querySelector('tbody');

    for (let th of ths) {
        th.addEventListener('click', function(e) {
            const tableRows = Array.from(tbody.querySelectorAll('tr'));
            let columnindex = [...ths].indexOf(th);
            let sortstate = this.dataset.sort;

            tableRows.sort((a, b) => {
                if (columnindex == 1 && sortstate == 'asc') {
                    th.dataset.sort = 'desc';
                    return a.children[columnindex].innerHTML.localeCompare(b.children[columnindex].innerHTML)
                } else if (columnindex == 1) {
                    th.dataset.sort = 'asc';
                    return b.children[columnindex].innerHTML.localeCompare(a.children[columnindex].innerHTML)
                } else if (sortstate == 'asc') {
                    th.dataset.sort = 'desc';
                    return parseFloat(b.children[columnindex].dataset.value) - parseFloat(a.children[columnindex].dataset.value);
                } else {
                    th.dataset.sort = 'asc';
                    return parseFloat(a.children[columnindex].dataset.value) - parseFloat(b.children[columnindex].dataset.value);
                }
            });

            for (let sortedrow of tableRows) {
                tbody.appendChild(sortedrow);
            }
        });
    };
};

const favEventListeners = function() {
    let favButtons = document.querySelectorAll('tr.item_row .fav button.fav-btn');
    for (let favButton of favButtons) {
        favButton.addEventListener('click', function() {
            let thisRow = this.closest('tr');
            let thisItemId = thisRow.dataset.id;
            let newState = (thisRow.dataset.fav === 'true') ? 'false' : 'true'
            thisRow.dataset.fav = newState;

            if (newState === 'true') {
                storage.setItem('fav-' + thisItemId, newState);
            } else {
                storage.removeItem('fav-' + thisItemId);
            }
        });
    }
}

window.onload = function() {
    combineSortData();
    getItems();
    makeSortable();
    favEventListeners();
};
