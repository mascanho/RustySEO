<div align="center">

<h1>RustySEO</h1>

##### A modern SEO/GEO toolkit

[![Rust](https://img.shields.io/badge/Rust-red.svg?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)

![Logo](assets/icon.png)

</div>

---

#### Shallow Crawl (Single Page)

![Logo](assets/hero.png)

#### Deep Crawl (Page Bulk)

![Logo](assets/hero2.png)

---

## RustySEO - A cross-platform SEO toolkit

RustySEO is an all-in-one, cross-platform Marketing toolkit, designed for comprehensive SEO & GEO analysis. It enables users to crawl websites and gain actionable insights into their marketing and SEO strategies.

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

# Setting up Google Search Console

- [Windows](#windows)
- [Mac OS](#usage)
- [Linux](#screenshots)

## Windows

To setup Google Search Console, follow these steps:

1. You need to set up [Google Cloud Console](https://console.cloud.google.com/) with Search Console API enabled and Service Account active. Make sure you have full ownership of your GSC property.

2. Launch RustySEO;

3. Go to the menu **Connectors** 👉 **Search Console**

4. Add your Google Search Console credentials

![RustySEO](assets/ss1.png)

You can find all the details in your Google Cloud console account with the exception of the "URL" and "Property Type", which should match what you have in your Google Search console account.

![RustySEO](assets/properties.png)

5. Submit the credentials and your desired options

6. Restart RustySEO

7. Since windows does not allow to output logs into the terminal by default, we just need to force it so that we can grab the link generated on the server to generate our token. Google keeps changing this but the goal is to have it done client-side (once I have the time). Launch RustySEO from Windows Powershell with the following command:

```bash
C:\Users\[your user]\AppData\Local\rustyseo\rustyseo.exe | Tee-Object -Filepath "C:\Users\[your user]\Downloads\rusty.log"
```

This will output all the logs into powershell. You will see a link from Google Auth. Simply open it in your browser with the same account that you generated your GSC API. Accept.

8. Restart RustySEO after the token has been generated

9. You should now see your GSC data inside RustySEO

## Mac OSX

After installation, you can start using My Software. Here are some basic instructions:

To setup Google Search Console, follow these steps:

1. You need to set up [Google Cloud Console](https://console.cloud.google.com/) with Search Console API enabled and Service Account active. Make sure you have full ownership of your GSC property.

2. Launch RustySEO;

3. Go to the menu **Connectors** 👉 **Search Console**

4. Add your Google Search Console credentials

![RustySEO](assets/ss1.png)

You can find all the details in your Google Cloud console account with the exception of the "URL" and "Property Type", which should match what you have in your Google Search console account.

![RustySEO](assets/properties.png)

5. Submit the credentials and your desired options

6. Restart RustySEO

7. Open your terminal and execute the following:

```bash
/Applications/rustyseo.app/Contents/MacOS/rustyseo
```

This will output all the logs into your terminal. You will see a link from Google Auth. Open it in your browser with the same account that you generated your GSC API. Accept the following prompts.

8. Restart RustySEO after the token has been generated

9. You should now see your GSC data inside RustySEO

## Linux

in a few weeks...
