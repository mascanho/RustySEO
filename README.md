<div align="center">

<h1>RustySEO</h1>

![Logo](assets/icon.png)


![Tauri](https://img.shields.io/badge/tauri-%2324C8DB.svg?style=for-the-badge&logo=tauri&logoColor=%23FFFFFF)
[![Rust](https://img.shields.io/badge/Rust-red.svg?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
![SQLite](https://img.shields.io/badge/sqlite-%2307405e.svg?style=for-the-badge&logo=sqlite&logoColor=white)
![Next JS](https://img.shields.io/badge/Next-black?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-%2338B2AC.svg?style=for-the-badge&logo=tailwind-css&logoColor=white)
[![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge&logo=discord&logoColor=white)](https://discord.gg/X49Kj7AT)

##### A free, modern SEO/GEO toolkit to help you crawl and analyse websites and server logs.
Without crawl limits, start ranking better on search engines.



</div>

---

#### Shallow Crawl (Single Page)

![Logo](assets/hero.png)

#### Deep Crawl (Page Bulk)

![Logo](assets/hero2.png)

#### Log analyser (Apache / Nginx)
![Logo](assets/logs.png)

#### Terminal Mode (Experimental)

TUI mode is a standalone app that requires to be installed separately. You can find it [here](https://github.com/mascanho/RustySEO-Headless).

![Logo](assets/tui.webp)

## RustySEO - A cross-platform SEO toolkit

RustySEO is an all-in-one, cross-platform Marketing toolkit, designed for comprehensive SEO & GEO analysis. It enables users to crawl websites, analise server logs gaining actionable insights into their marketing and SEO strategies.

As an open-source project, RustySEO aims to enhance your SEO efforts. Please note that initial versions may have bugs and issues, and we welcome your contributions in the form of bug reports or fixes via our repository.

Our mission is to offer a robust, free alternative to the costly commercial SEO tools currently on the market.

Keep in mind that all the integrations are free to use (up to an extent). Its abuse will result in 404 or 503 by the providers.

As long as you don't spam (many requests per second) you should be ok to use RustySEO as your daily driver for SEO. :)

## 🔖 TL;DR

For a better experience you need to get a [Google PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/get-started) API KEY.

Got to "Connectors" > "PageSpeed Insights" and add your key, for the time being you can try one I generated (It will expire over time):

```bash
AIzaSyAHsCM-Cs4cCqdGi798wh8af-bSnXbVUjw
```

We recommend using Google Gemini if you want the best AI features.

As of today, the smaller local LLMs are not working properly and are not recommended if you want to make the most of the AI features.

These LLMs might get deprecated due to their lack of uniform performance across different models.

Authentication currently takes place server side, as such it is slightly more cumbersome when integrating with Google OAuth 2.0. This is particularly true
for Google Search Console (GSC) and Google Analytics 4 (GA4)

This authentication will be passed to the client-side in the future.

Use at your own risk, this software is new and under development.

‼️ You will get prompted with "Unknown/Unregistered Developer" on Windows and Mac. See below how to open and install ‼️

[Windows](https://www.process.st/how-to/turn-off-microsoftverified-app-windows-11/#:~:text=This%20can%20be%20helpful%20if,option%20to%20install%20from%20anywhere.) [Mac OS](https://support.apple.com/en-gb/102445)

## 🤘 Features

- Shallow & deep crawl;
- Technical Diagnostics (core web vitals, Page Speed Insights);
- On-Page SEO Analysis (content analysis, Keyword density, etc...);
- Improvements / Suggestions on page crawl;
- Dashboards;
- Task Manager / Tracker
- Reporting (CSV, Excel, Google Sheets, PDF);
- Topic generator;
- Keyword generator;
- Local LLM (ollama);
- Free API LLM (Google Gemini);
- Built-in AI chatbot;
- Crawl history;
- Image conversion and optimization;

## 🗺️ Roadmap

|  #  | Feature                                  | Status |
| :-: | ---------------------------------------- | :----: |
|  1  | Deep crawl (multiple pages concurrently) |   ✅   |
|  2  | More integrations                        |   ✅   |
|  3  | Better reporting                         |   ✅   |
|  4  | Password protection & encryption         |   ⚠️   |
|  5  | Client-side OAuth2 authentication        |   ⚠️   |
|  6  | Better local LLM support                 |   ❌   |
|  7  | SEMrush Integration                      |   ⚠️   |
|  8  | Topic / Content calendar view            |   ✅   |
|  9  | Regression Analysis of GA4 data          |   ⚠️   |
| 10  | Topic Modeling                           |   ⚠️   |
| 11  | Chatbot Crawl Context                    |   ✅   |
| 12  | Extraction of HTML / JS / CSS fragments  |   ☠️   |
| 13  | Schema Generator & Validator             |   ✅   |
| 14  | Keyword Clustering                       |   ⏳   |
| 15  | Machine Learning                         |   ✅   |
| 16  | Collaboration                            |   ⏳   |
| 17  | API / Streaming                          |   ⏳   |
| 18  | Very Large website support (> 100K URLs) |   🏋🏻   |

## 🔌 Connectors / APIs (Get your keys, they are free 😉)

- [Google Search Console](https://search.google.com/search-console/about)
- [Google Cloud Platform](https://console.cloud.google.com/welcome)
- [GA4](https://analytics.google.com/analytics/web/)
- [Google Gemini](https://ai.google.dev/gemini-api/docs/api-key)
- [Ollama](https://ollama.ai/)
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed)
- [Microsoft Clarity](https://clarity.microsoft.com/)

## ⌨️ Keymaps

|       Keys       | Result                   |
| :--------------: | ------------------------ |
|     CTRL + D     | Deep Crawl               |
|     CTRL + S     | Shalow Crawl             |
|     CTRL + H     | Toggle Sidebar           |
|     CTRL + L     | Toggle Side Task Manager |
|     CTRL + T     | Create TODO/Task         |
| CTRL + Shift + C | Delete Logs From DB      |
| CTRL + /         | Clear cache              |
| CTRL + Shift + / | Full app reset           |
