import Tab = chrome.tabs.Tab;
import CreateProperties = chrome.tabs.CreateProperties;
export function isEmptyObj(obj) {
    return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function addScript(template, silent) {
    if (silent === undefined) {
        silent = false;
    }

    let s = document.createElement("script");
    if (template.src) {
        s.src = template.src;
    }

    if (template.textContent) {
        s.textContent = template.textContent;
    }

    document.documentElement.appendChild(s);

    if (silent) {
        document.documentElement.removeChild(s);
    }
}

export function createTab(firstRun: boolean = false, url: string = "https://www.twitch.tv"): Promise<Tab> {
    return new Promise((resolve) => {
        chrome.tabs.query({url: ["https://www.twitch.tv/*"], currentWindow: true}, (tabs: Tab[]) => {
            if (tabs.length != 0) {
                let selectedTab = undefined;
                for (let tab of tabs) {
                    if (tab.active) {
                        selectedTab = tab;
                    }
                }
                if (undefined === selectedTab) {
                    selectedTab = tabs[0];
                }
                let settings: any = {active: true};
                
                // if just installed, reload the page so the correct scripts get injected ))
                if (firstRun) {
                    settings.url = "https://www.twitch.tv/";
                }
                chrome.tabs.update(selectedTab.id, {active: true}, (tab: Tab) =>
                    resolve(tab)
                );
            } else {
                chrome.tabs.create({url: url}, (tab: Tab) => {
                    resolve(tab);
                });
            }
        });
    });
}
