use url::Url;

pub fn calculate_url_depth(url: &Url) -> usize {
    url.path_segments().unwrap().count()
}
