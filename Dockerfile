FROM bayesimpact/react-base:latest

RUN apt-get update -qqy && apt-get install -qqy --no-install-recommends gconf-service libasound2 \
  libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 \
  libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release jq python3 python3-pip \
  xdg-utils && pip3 install --upgrade pip setuptools wheel && pip install 'typescript-protobuf>=0.5'

# Install needed node modules (most of them should already be in base
# image).
COPY package.json .
RUN node node_modules/.bin/yarn-lazy-lock && yarn install
RUN npm list --depth=0; exit 0

COPY src src/
COPY .eslintrc.json .eslintignore tsconfig.json ./

COPY cfg/html_plugin.sh cfg/
RUN bash -x cfg/html_plugin.sh

ARG SKIP_TEST=
RUN test -n "$SKIP_TEST" && echo "Skipping tests" || (npm run lint & npm run check-types)

CMD npm start
