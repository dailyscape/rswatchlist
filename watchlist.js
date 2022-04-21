const getItems = function() {
    const lazyloadAfter = 30;
    const sampleRow = document.querySelector('#sample_row');
    const table = document.getElementById('item_table');
    const tbody = table.querySelector('tbody');
    let lazyloadCount = 0;
    for (let itemid in rselydata) {
        if (itemid in rsapidata || (itemid in rselydata && rselydata[itemid].elyprices.length > 0)) {
            let rowClone = sampleRow.content.cloneNode(true);
            let newRow = rowClone.querySelector('tr');

            let elyLink = '<a href="https://www.ely.gg/search?search_item=' + rselydata[itemid].elyname + '" target="_blank" rel=\"noreferrer noopener\">';
            let displayName = '';

            newRow.dataset.id = itemid;

            if (itemid in rsapidata) {
                newRow.children[1].dataset.value = rsapidata[itemid].price;
                newRow.children[1].innerHTML = rsapidata[itemid].price.toLocaleString() + '<span class="coin">●</span>';
                displayName = rsapidata[itemid].name;
                let wikinamelink = rsapidata[itemid].name.toLowerCase().replace(/\s+/g, '_');
                wikinamelink = wikinamelink.charAt(0).toUpperCase() + wikinamelink.slice(1);
                wikiLink = '<a href="https://runescape.wiki/w/' + wikinamelink + '" target="_blank" rel=\"noreferrer noopener\">';
            } else {
                newRow.children[1].dataset.value = 0;
                displayName = rselydata[itemid].elyname;
            }

            let lazyloadHtml = (lazyloadCount > lazyloadAfter) ? ' loading="lazy"' : 'loading="eager"';

            newRow.children[0].innerHTML = wikiLink + '<img class="item_icon" src="/rsdata/images/' + itemid + '.gif" ' + lazyloadHtml +'></a> ' + elyLink + displayName + '</a>';
            // 📖
            // 📈

            if (rselydata[itemid].elyprices.length == 1 ) {
                let dateThreshold=new Date();
                dateThreshold.setMonth(dateThreshold.getMonth() - 2);
                let dateTraded=new Date(rselydata[itemid].elyprices[0].date);
                let oldishPirce = rselydata[itemid].elyprices[0].price;
                newRow.children[2].dataset.value = oldishPirce;
                if (dateTraded <= dateThreshold) {
                    newRow.children[2].innerHTML = '<span class="oldish-price" title="Last Entry: ' + rselydata[itemid].elyprices[0].date + '">' + parseInt(oldishPirce).toLocaleString() + '<span class="oldman">👴</span></span>';
                } else {
                    newRow.children[2].innerHTML = parseInt(oldishPirce).toLocaleString() + '<span class="coin">●</span>';
                }
            } else if (rselydata[itemid].elyprices.length > 0) {
                totalprice=0
                for (let price of rselydata[itemid].elyprices) {
                    totalprice+=price.price
                }
                let avgprice=totalprice / rselydata[itemid].elyprices.length;
                newRow.children[2].dataset.value = avgprice;
                newRow.children[2].innerHTML = parseInt(avgprice).toLocaleString() + '<span class="coin">●</span>';
            } else {
                newRow.children[2].dataset.value = 0;
            }
            tbody.appendChild(newRow);
            lazyloadCount++;
        } else {
            console.log("Item ID: " + itemid + " " + rselydata[itemid].elyname + " no price data found");
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
                if (columnindex == 0 && sortstate == 'asc') {
                    th.dataset.sort = 'desc';
                    return a.children[columnindex].innerHTML.localeCompare(b.children[columnindex].innerHTML)
                } else if (columnindex == 0) {
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

const defaultSort = function() {
    let defaultSortColumn = 2;
    let secondarySortColumn = 1;

    const table = document.getElementById('item_table');
    const tbody = table.querySelector('tbody');

    const tableRows = Array.from(tbody.querySelectorAll('tr'));

    tableRows.sort((a, b) => {
        let sortSolution = b.children[defaultSortColumn].dataset.value - a.children[defaultSortColumn].dataset.value;
        if (sortSolution == 0) {
            sortSolution = b.children[secondarySortColumn].dataset.value - a.children[secondarySortColumn].dataset.value;
        }
        return sortSolution;
    });

    for (let sortedrow of tableRows) {
        tbody.appendChild(sortedrow);
    }
}

window.onload = function() {
    getItems();
    makeSortable();
    defaultSort();
};
