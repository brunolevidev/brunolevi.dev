# Personal Website & Portfolio

## Installation

### Go 1.17.3 installation on Ubuntu 20.04

First, connect to your Ubuntu server via ssh:
```ssh sammy@your_server_ip```

Now that you have your link ready, first confirm that you’re in the home directory:

```bash
cd ~
```

Then use curl to retrieve the tarball, making sure to replace the highlighted URL with the one you just copied. The -O flag ensures that this outputs to a file, and the L flag instructs HTTPS redirects, since this link was taken from the Go website and will redirect here before the file downloads:
```curl -OL https://go.dev/dl/go1.17.3.linux-amd64.tar.gz```

To verify the integrity of the file you downloaded, run the sha256sum command and pass it to the filename as an argument:

```bash
sha256sum go1.17.3.linux-amd64.tar.gz
```

This will return the tarball’s SHA256 checksum. If the checksum matches the one listed on the downloads page, you’ve done this step correctly.

Next, use tar to extract the tarball. This command includes the -C flag which instructs tar to change to the given directory before performing any other operations. This means that the extracted files will be written to the /usr/local/ directory, the recommended location for installing Go.. The x flag tells tar to extract, v tells it we want verbose output (a listing of the files being extracted), and f tells it we’ll specify a filename:

```bash
sudo tar -C /usr/local -xvf go1.17.3.linux-amd64.tar.gz
```

Use your preferred editor to open .profile, which is stored in your user’s home directory. Here, we’ll use nano:

```bash
sudo vim ~/.profile
# Then, add the following information to the end of your file:
export PATH=$PATH:/usr/local/go/bin
```

Next, refresh your profile by running the following command:

```bash
source ~/.profile
```

After, check if you can execute go commands by running go version:

```bash
go version
```

## Hugo installation on Ubuntu 20.04

@anthonyfok and friends in the Debian Go Packaging Team maintains an official hugo Debian package which is shared with Ubuntu and is installable via apt-get:

```bash
sudo apt-get install hugo
```

## Install this proyect

Clone the project:

```bash
git clone git@github.com:BrunoVelazquez/brunovelazquez.com.git
```

Then serve:

```bash
hugo server -D
```
