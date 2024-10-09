![Logo](assets/hero.jpg)


# RustySEO - A cross platform SEO toolkit

RustySEO is an all-in-one, cross-platform toolkit designed for comprehensive SEO analysis. It enables users to crawl websites and gain actionable insights into their marketing and SEO strategies.

As an open-source project, RustySEO aims to enhance your SEO efforts. Please note that initial versions may have bugs and issues, and we welcome your contributions in the form of bug reports or fixes via our repository.

Our mission is to offer a robust, free alternative to the costly commercial SEO tools currently on the market.

## Features

- Shallow crawl (single page);
- Technical Diagnostics (core web vitals);
- SEO insights (content analysis, Keyword density, etc...);
- Improvements / Suggestions on page crawl;
- Dashboards;
- Task Manager / Tracker
- Reporting (CSV, Excel, Google Sheets, PDF);
- Topic generator;
- Keyword generator;
- Local LLM (ollama);
- Free API LLM (Google Gemini);
- Built in AI chatbot;
- Crawl history;
- Integrations (Google Seach Console, GA)

## Roadmap

- Deep crawl (multiple pages);
- More integrations;

## Connectors / APIs (Get your keys, they are free 😉)
- [Google Search Console](https://developers.google.com/webmaster-tools/v3/search-console/api-v3/reference/rest/)
- [GA](https://developers.google.com/analytics/devguides/reporting/data/v1/rest/v1beta/reports/batchGet)
- [Google Gemini](https://developers.google.com/search/docs/advanced/crawling/overview)
- [ollama](https://ollama.ai/docs/api)
- [PageSpeed Insights](https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed)

## Setting up Google Search Console

- [Windows](#windows)
- [Mac OS](#usage)
- [Linux](#screenshots)

## Windows

To setup Google Search Console, follow these steps:

1. Launch RustySEO;

![RustySEO](./screenshots/rustyseo.png)

2. Go to the menu **Connectors** 👉 **Search Console**

![RustySEO](./screenshots/rustyseo.png)

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Run the software**:

   ```bash
   npm start
   ```

## Usage

After installation, you can start using My Software. Here are some basic instructions:

1. **Open the application**:

   Open your browser and go to `http://localhost:3000`.

2. **Login**:

   ![Login Screen](./screenshots/login.png)

   Enter your username and password, then click "Login."

3. **Navigate the Dashboard**:

   ![Dashboard](./screenshots/dashboard.png)

   Use the menu on the left to navigate through different sections of the application.

4. **Perform a Task**:

   ![Task Screen](./screenshots/task.png)

   Follow the instructions on the screen to complete your task.

## Screenshots

Here are some screenshots of the application:

- **Login Screen**:

  ![Login Screen](./screenshots/login.png)

- **Dashboard**:

  ![Dashboard](./screenshots/dashboard.png)

- **Task Screen**:

  ![Task Screen](./screenshots/task.png)

## Troubleshooting

If you encounter any issues, check the following:

- **Ensure dependencies are installed**: Run `npm install` again to make sure all dependencies are correctly installed.
- **Check for errors**: Review the terminal output for any error messages.
- **Consult the documentation**: Check the [docs](./docs) for more detailed information.

If you need further assistance, feel free to open an issue on GitHub or contact support.

## Contributing

We welcome contributions! If you'd like to contribute to My Software, please follow these guidelines:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to the branch (`git push origin feature/your-feature`).
5. Create a new Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.
