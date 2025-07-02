# InstaLoad

InstaLoad is a tool designed to simplify the process of downloading images and videos from Instagram. It provides a user-friendly interface and supports batch downloads, making it easy to save content for offline viewing or backup.

## Features

- Download images and videos from Instagram posts
- Batch download support
- Simple and intuitive interface
- Fast and reliable performance

## Installation

Clone the repository:

```bash
git clone https://github.com/yourusername/instaload.git
cd instaload
```

Install dependencies:

```bash
pip install -r requirements.txt
```

## Usage

Run the tool:

```bash
python instaload.py
```

Follow the on-screen instructions to enter Instagram post URLs and download content.

### Authentication with `gallery_dl`

InstaLoad uses `gallery_dl` for downloading content. To authenticate with your Instagram account, you can use the `--cookies` or `--username` and `--password` arguments. This allows access to private or restricted content.

**Example usage:**

```bash
gallery-dl --username YOUR_USERNAME --password YOUR_PASSWORD https://www.instagram.com/p/POST_ID/
```

Alternatively, you can provide a cookies file:

```bash
gallery-dl --cookies cookies.txt https://www.instagram.com/p/POST_ID/
```

Refer to the [gallery-dl documentation](https://github.com/mikf/gallery-dl#authentication) for more details on authentication options.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.

## License

This project is licensed under the MIT License.