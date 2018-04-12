test:
	./run-tests.sh
	./run-tests.sh -r

install:
	yarn

clean:
	rm ./tests/*.result-test