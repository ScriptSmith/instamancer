import * as express from "express";
import {AddressInfo} from "net";

const app = express();

app.get("/", (req, res) => {
    res.send(`
            <script type="text/javascript">
                const endpoints = ["rate_limit", "invalid_json", "no_next_page", "duplicate_ids"];
                setInterval(() => {
                    for (const endpoint of endpoints) {
                        console.log("API request to " + endpoint);
                        const xhttp = new XMLHttpRequest();
                        xhttp.open("GET", endpoint, true);
                        xhttp.send();
                    }
                }, 2000)
            </script>
        `);
});

app.get("/rate_limit", (req, res) => {
    res.send(JSON.stringify({
            status: "fail",
        }),
    );
});

app.get("/invalid_json", (req, res) => {
    res.send("invalid");
});

app.get("/no_next_page", (req, res) => {
    res.send(JSON.stringify({
        data: {
            end_cursor: "cursor",
            has_next_page: false,
        },
    }));
});

app.get("/duplicate_ids", (req, res) => {
    res.send(JSON.stringify({
        data: {
            edges: [
                {
                    node: {
                        id: "1",
                    },
                },
                {
                    node: {
                        id: "1",
                    },
                },
            ],
            end_cursor: "cursor",
            has_next_page: true,
        },
    }));
});

const listener = app.listen(0);

export function spawnServer(): number {
    return (listener.address() as AddressInfo).port;
}
