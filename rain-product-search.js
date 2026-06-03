// ==UserScript==
// @name         Highlight catalog searches
// @namespace    http://tampermonkey.net/
// @version      2026-06-03
// @description  Highlights matches / mismatches when searching for products, as UPC mismatches are likely to override the scanned UPC and cause problems.
// @author       https://github.com/Groxx
// @match        https://www.rainadmin.com/site-configuration/products/edit-product.php*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=rainadmin.com
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // #searchResultsModal pops up
    // #manufacturerSearchModal has the search input
    // .catalog-search-results-wrapper contains results
    // <catalog-search-item> gets highlight
    /*
        <div class="catalog-search-product-mfr">
            <div class="info-label">MFR: </div>
            <div class="info-text ng-binding">QT FABRICS</div>
        </div>
        <div class="catalog-search-product-src">
            <div class="info-label">Source: </div>
            <div class="info-text ng-binding">QT Fabrics</div>
        </div>
        <div class="catalog-search-product-upc">
            <div class="info-label">UPC: </div>
            <div class="info-text ng-binding">016542569271</div>
        </div>
        <div class="catalog-search-product-mfrid">
            <div class="info-label">MFR ID: </div>
            <div class="info-text ng-binding">31438-J</div>
        </div>
    */

    // wait for page elements to load, then run.
    // the new UI delays this a fair bit, so just wait.
    // not yet sure what to do with the old UI, working on it.
    const newUI = () => {
        let modal = document.getElementById("searchResultsModal");
        let query = modal.querySelector("input#manufacturerSearchModal"); // multiple share this ID in the page, need the one in the modal
        let results = modal.querySelector(".catalog-search-results-wrapper");
        console.log("loaded:", modal, query, results);
        const updateColors = (muts, obs) => {
            console.log("results changed, searching for matching text");
            results.querySelectorAll("catalog-search-item").forEach((c) => {
                console.log("  got item:", c);
                let found = false;
                c.querySelectorAll(".info-text").forEach((e) => {
                    console.log("    got text:", e.textContent, query.value);
                    const matches = e.textContent.match("(.*)("+query.value+")(.*)");
                    if (matches && matches.length == 4) {
                        if (matches[1] == "" && matches[3] == "" ){
                            // exact match
                            found=true;
                            e.parentElement.style.background="#8F8";
                        } else {
                            // partial match, dangerous.
                            // TODO: ditch strings, make elements
                            const span = (text)=>{
                                let s = document.createElement("span");
                                s.style.backgroundColor="#F88";
                                s.innerText = text;
                                return s;
                            }
                            e.innerText = "";
                            e.appendChild(span(matches[1]));
                            e.appendChild(document.createTextNode(matches[2]));
                            e.appendChild(span(matches[3]));
                        }
                    }
                    // else ignore the field
                    if (e.textContent == query.value) {
                        found = true;
                        e.parentElement.style.background="#8F8";
                    } else if (query.value.match(e.textContent)) { // contains
                        e.parentElement.style.background="#DD8";
                    }
                });
                if (found) {
                    c.querySelector(".catalog-search-product-summary").style.background="#FFF";
                    c.querySelector(".catalog-search-product-full").style.background="#FFF";
                } else {
                    c.querySelector(".catalog-search-product-summary").style.background="#FDD";
                    c.querySelector(".catalog-search-product-full").style.background="#FDD";
                }
            });
        };
        const resultObserver = new MutationObserver(updateColors);
        const modalObserver = new MutationObserver((muts, obs) => {
            if (modal.style.display == "none") {
                // unload
                resultObserver.disconnect();
            } else {
                // load
                updateColors();
                resultObserver.observe(results, {
                    childList: true, // definitely, immediate children are results
                    subtree: false, // going to mutate the subtree, don't watch it
                });
            }
        }).observe(modal, {
            attributes: true,
            childList: false,
            subtree: false,
        });
    };

    let done = setInterval(() => {
        if (document.getElementById("searchResultsModal")) {
            clearInterval(done);
            newUI();
        }
    }, 1000);
})();
